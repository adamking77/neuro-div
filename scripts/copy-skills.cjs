const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_SKILL_PATHS = [
  "_shared",
  "nd-context-builder",
  "nd-process-designer",
  "spine-finder",
  "nd-session-loop",
];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const destinationRoot = path.join("public", "skills");
fs.rmSync(destinationRoot, { force: true, recursive: true });

for (const skillPath of PUBLIC_SKILL_PATHS) {
  copyDir(path.join("skills", skillPath), path.join(destinationRoot, skillPath));
}

console.log("Copied public NeuroDiv skills -> public/skills/");
