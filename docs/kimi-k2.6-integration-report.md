# Kimi k2.6 Integration Report: What Went Wrong & Why

**Date:** 2026-05-09
**Model:** `kimi-k2.6` (Moonshot AI)
**Previous Working Model:** `moonshot-v1-128k` (now deprecated)
**Status:** UNRESOLVED — production shows internal model dialogue in analysis cards

---

## 1. Root Cause: kimi-k2.6's Reasoning Mode

The fundamental issue is that **kimi-k2.6 always outputs its response in `reasoning_content`** instead of the standard `content` field. This reasoning field contains:

1. **Internal thought process** — the model "thinking out loud"
2. **Template references** — the model restating the system prompt format instructions
3. **Draft attempts** — the model writing a first draft, then revising
4. **Self-correction** — the model checking its own work ("Wait, I need to verify...")
5. **Final answer** — the actual useful content (sometimes)

Unlike OpenAI's o1/o3 models which cleanly separate thinking from output, kimi-k2.6's `reasoning_content` is the **only** output field. The `content` field is always empty (`""`).

### Example raw output:
```
The user wants me to analyze search results...

Let me think through the framework:
- SUMMARY: Need to describe patterns
- VERDICT: Must start with Yes/No/Partially

Let me draft:
SUMMARY: [2-3 sentences]           ← TEMPLATE ECHO
VERDICT: [Yes/No/Partially]        ← TEMPLATE ECHO
EVIDENCE: [single most specific]   ← TEMPLATE ECHO
IMPLICATION: [what this means]     ← TEMPLATE ECHO

Wait, I need to check if I'm following rules:
- No hedging? Let me verify...
- Actually, looking again...

Let me refine:

SUMMARY: The search results confirm...
VERDICT: Partially — the results...
EVIDENCE: Result [2] states...
IMPLICATION: You need to...

Check rules:
- VERDICT starts with Partially? Yes.
- No hedging? Checked.
```

---

## 2. Issues Encountered (In Order)

### Issue 1: 401 Authentication Error
**Cause:** Subscription cancellation invalidated old API key
**Fix:** Generated new pay-per-use key
**Status:** ✅ FIXED

### Issue 2: Wrong Base URL (`.cn` vs `.ai`)
**Cause:** `KIMI_BASE_URL` was set to `api.moonshot.cn` which rejected the new key
**Fix:** Changed to `api.moonshot.ai`
**Status:** ✅ FIXED

### Issue 3: Model Name Format
**Cause:** `kimi-k2-6` vs `kimi-k2.6`
**Fix:** Updated to correct format
**Status:** ✅ FIXED

### Issue 4: Temperature Parameter
**Cause:** k2.6 only accepts `temperature: 1`, not `0.7`
**Fix:** Changed all routes
**Status:** ✅ FIXED

### Issue 5: Empty `content` Field
**Cause:** k2.6 puts all output in `reasoning_content`
**Attempt 1:** Added `reasoning_content` fallback
**Status:** ❌ FAILED — captured internal dialogue too

### Issue 6: max_tokens Too High
**Cause:** 2000/4000 tokens made k2.6 take 60-120s per request
**Fix:** Reduced to 800/1200
**Status:** ✅ FIXED (mostly)

### Issue 7: Browser Timeout
**Cause:** Frontend fetch() times out before API finishes
**Fix:** Added 3-minute AbortController
**Status:** ✅ FIXED

### Issue 8: API Overload (6 Parallel Requests)
**Cause:** All 6 phases hit the API simultaneously
**Fix:** Added 8-second stagger + retry logic
**Status:** ✅ FIXED

### Issue 9: Template Echoing (THE MAIN PROBLEM)
**Cause:** Model outputs system prompt templates as content
**Attempts:**
- Changed brackets `[2-3 sentences]` to parentheses `(write 2-3 sentences)`
- Added "Do NOT output template placeholders" instruction
- Stripped text before first `SUMMARY:`
- Stripped text before last `SUMMARY:`
- Simplified system prompt to remove template-like text
- None worked consistently
**Status:** ❌ UNRESOLVED

### Issue 10: Meta-Text in Parsed Output
**Cause:** Model appends self-check after final answer
**Examples:**
- "Wait, I need to check..."
- "Let me refine:"
- "Check rules:"
- "Actually, looking again..."
**Attempts:**
- Truncated implication at meta-text markers
- Regex-based stripping
- Parser validation functions
**Status:** ❌ PARTIALLY FIXED — still leaks through

---

## 3. Parser Evolution (Why Each Attempt Failed)

### Attempt 1: Simple Regex
```typescript
const summaryMatch = raw.match(/SUMMARY:
(.+?)(?=VERDICT:|$)/i);
```
**Failed because:** Found FIRST `SUMMARY:` which was template placeholder

### Attempt 2: Find LAST `SUMMARY:`
```typescript
const lastIdx = raw.toUpperCase().lastIndexOf("SUMMARY:");
raw = raw.slice(lastIdx);
```
**Failed because:** Model writes meta-text AFTER final answer, so last `SUMMARY:` might be followed by meta-text

### Attempt 3: Find ALL Sections in Order
```typescript
// Find all occurrences, work backwards
const sIdxs = findAll("SUMMARY:");
const vIdxs = findAll("VERDICT:");
// ...find last complete set
```
**Failed because:** Meta-text contains template section headers ("- SUMMARY: 2-3 sentences...") which pollute the index lists

### Attempt 4: Skip Templates + Meta-Text
```typescript
const isTemplate = (s) => {
  if (s.startsWith("[2-3")) return true;
  if (s.startsWith("(write")) return true;
  // ...etc
};
```
**Failed because:** Model STILL outputs templates no matter what the prompt says

### Attempt 5: Truncate at Meta Markers
```typescript
const metaStart = implication.search(/

(?:Wait,|Actually,|Let me)/i);
```
**Failed because:** Meta-text patterns vary — model invents new ones

---

## 4. What We Know Works

### ✅ API Authentication
- Key: `sk-zEoZX5kX2RD6fVDMYjcb2WCZwboFHF4OAGdD730suiEoN5cm`
- Base URL: `https://api.moonshot.ai/v1`
- Model: `kimi-k2.6`
- Temperature: `1`
- max_tokens: `800` for phase-synthesis, `1200` for others

### ✅ Basic API Calls
Direct curl works and returns structured output:
```bash
curl https://api.moonshot.ai/v1/chat/completions \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimi-k2.6",
    "max_tokens": 800,
    "temperature": 1,
    "messages": [...]
  }'
```

### ✅ Response Structure
```json
{
  "choices": [{
    "message": {
      "content": "",
      "reasoning_content": "The user wants me to... SUMMARY: ... VERDICT: ..."
    }
  }]
}
```

---

## 5. What Still Needs Fixing

### The Core Problem
**The model cannot be reliably prompted to output clean, structured text without internal dialogue.**

This is a model behavior issue, not a parsing issue. The parsing attempts are treating symptoms, not the disease.

### Potential Solutions (Untested)

#### Option A: Use a Different Model
Switch to `moonshot-v1-128k` or `moonshot-v1-auto` which:
- Don't use reasoning mode
- Output in `content` field directly
- Are faster and more predictable

**Trade-off:** May have different capabilities/quality than k2.6

#### Option B: Post-Process with Secondary LLM Call
After getting the raw k2.6 output:
1. Send it to a simpler model (or even k2.6 with different prompt)
2. Ask it to extract just the four sections
3. Use that cleaned output

**Trade-off:** Doubles API cost and latency

#### Option C: Use JSON Mode (If Available)
If Moonshot supports structured output / JSON mode:
```json
{
  "response_format": { "type": "json_object" },
  "messages": [{
    "role": "user",
    "content": "Output as JSON: {\"summary\": \"...\", \"verdict\": \"...\", ...}"
  }]
}
```
**Trade-off:** May not be supported by kimi-k2.6

#### Option D: Use a Wrapper/Proxy
Create a simple proxy service that:
1. Calls kimi-k2.6
2. Runs a local LLM (or regex) to clean the output
3. Returns structured JSON

**Trade-off:** Adds infrastructure complexity

#### Option E: Accept Imperfection
Show the raw output to users with a "Model Analysis" label, letting them see the reasoning process.

**Trade-off:** Degrades UX

---

## 6. Key Learnings

1. **kimi-k2.6 is fundamentally different** from previous models — it ALWAYS outputs reasoning text
2. **Prompt engineering alone cannot fix this** — the model ignores instructions to not output templates
3. **Parsing is harder than it looks** — the model's output structure varies wildly between requests
4. **Template echoing is the model's default behavior** — no prompt variation tested prevented it
5. **Meta-text is unpredictable** — the model invents new self-check patterns

---

## 7. Files Modified

- `app/api/phase-synthesis/route.ts` — Multiple prompt/parser changes
- `app/api/intelligence-brief/route.ts` — Added `reasoning_content` support
- `app/api/strategy-draft/route.ts` — Added `reasoning_content` support
- `api/_lib/intelligence-api.ts` — Added `reasoning_content` interface
- `api/_lib/strategy-api.ts` — Fixed base URL and model name defaults
- `src/App.tsx` — Added retry logic, sequential execution, fetch timeout

---

## 8. Recommendation

**Switch to `moonshot-v1-128k` or `moonshot-v1-auto` for production.**

kimi-k2.6's reasoning mode is too unpredictable for structured output. The time spent trying to parse its internal dialogue would be better spent using a model that outputs clean `content` directly.

If k2.6 is required, implement **Option B** (secondary cleanup call) or **Option D** (proxy service) as a proper engineering solution.

---

*Document written after 30+ deployment attempts and multiple parser rewrites.*
