import fs from "node:fs";
import path from "node:path";

export const IMAGE_EXTENSION_RE = /\.(?:png|gif|jpe?g|webp|svg)$/i;

const SKIP_DIRS = new Set(["node_modules", ".git", "_yoao-source", "dist", "cache"]);

export function* walkFiles(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walkFiles(path.join(dir, entry.name), predicate);
    } else if (predicate(entry.name)) yield path.join(dir, entry.name);
  }
}

export function withoutMarkdownCode(markdown) {
  let fence;
  return markdown
    .split(/\r?\n/)
    .filter((line) => {
      const marker = /^[ \t]*(`{3,}|~{3,})(.*)$/.exec(line);
      if (fence) {
        if (marker?.[1].startsWith(fence) && !marker[2].trim()) fence = undefined;
        return false;
      }
      if (!marker) return true;
      fence = marker[1];
      return false;
    })
    .join("\n")
    .replace(/<!--[\s\S]*?-->|(`+)[^\n]*?\1/g, "");
}

export function extractImageReferences(markdown) {
  const imageRe =
    /!\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\)|<img\b[^>]*?\ssrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  return Array.from(markdown.matchAll(imageRe), (match) => match[1] ?? match[2] ?? match[3]);
}

export function resolveLocalMediaPath(src, sourcePath, docsRoot) {
  const cleaned = src.trim().split(/[?#]/, 1)[0];
  if (!cleaned || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(cleaned)) return null;
  let decoded = cleaned;
  try {
    decoded = decodeURIComponent(cleaned);
  } catch {}
  if (!decoded.startsWith("/")) return path.resolve(path.dirname(sourcePath), decoded);
  const relative = decoded.slice(1);
  const publicPath = path.join(docsRoot, "public", relative);
  return fs.existsSync(publicPath) ? publicPath : path.join(docsRoot, relative);
}
