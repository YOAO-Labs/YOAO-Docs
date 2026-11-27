#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(here, "..");
const themeRoot = path.join(docsRoot, ".vitepress", "theme");

const EXEMPT_FILES = new Set([
  path.join(themeRoot, "styles", "tokens.css"),
  path.join(themeRoot, "styles", "tailwind.css"),
]);

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_COLOR_RE = /\brgba?\s*\(/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else if (entry.isFile() && /\.(css|vue)$/.test(entry.name)) out.push(abs);
  }
  return out;
}

function scanLines(relPath, content, lineOffset = 0, findings = []) {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hexMatches = [...line.matchAll(HEX_COLOR_RE)].map((m) => m[0]);
    const rgbMatches = [...line.matchAll(RGB_COLOR_RE)].map((m) => m[0]);
    for (const token of [...hexMatches, ...rgbMatches]) {
      findings.push({
        file: relPath,
        line: lineOffset + i + 1,
        token,
        excerpt: line.trim(),
      });
    }
  }
  return findings;
}

function checkVueFile(relPath, raw) {
  const findings = [];
  for (const match of raw.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    const before = raw.slice(0, match.index);
    const offset = before.split(/\r?\n/).length - 1;
    scanLines(relPath, match[1], offset, findings);
  }

  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /\b(?:fill|stroke|color|style|:style)\s*=/.test(line) ||
      /\b(?:bg|text|border|ring|fill|stroke)-\[[^\]]*\]/.test(line)
    ) {
      for (const m of line.matchAll(HEX_COLOR_RE)) {
        if (line.includes("url(#")) continue;
        findings.push({ file: relPath, line: i + 1, token: m[0], excerpt: line.trim() });
      }
      for (const m of line.matchAll(RGB_COLOR_RE)) {
        findings.push({ file: relPath, line: i + 1, token: m[0], excerpt: line.trim() });
      }
    }
  }
  return findings;
}

const files = walk(themeRoot).filter((abs) => !EXEMPT_FILES.has(abs));
const allFindings = [];

for (const abs of files) {
  const rel = path.relative(docsRoot, abs).replace(/\\/g, "/");
  const raw = fs.readFileSync(abs, "utf8");
  if (abs.endsWith(".css")) {
    scanLines(rel, raw, 0, allFindings);
  } else {
    allFindings.push(...checkVueFile(rel, raw));
  }
}

if (allFindings.length > 0) {
  console.error(`[check-theme-tokens] 发现 ${allFindings.length} 处硬编码颜色值：`);
  for (const f of allFindings) {
    console.error(`  ${f.file}:${f.line} [${f.token}] ${f.excerpt}`);
  }
  console.error("请改用 .vitepress/theme/styles/tokens.css 中的语义令牌（--yoao-*）。");
  process.exit(1);
}

console.log(`[check-theme-tokens] OK · 已检查 ${files.length} 个主题文件，无硬编码颜色。`);
