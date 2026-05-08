import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Ensure skills are in public/ so they're included in the deployment bundle
// and available to App Router API routes at runtime on Vercel
copyDir("skills", "public/skills");

const nextConfig: NextConfig = {};

export default nextConfig;
