#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DOCS_ROOT, resolveYoaoRepoRoot } from "./_repo-root.mjs";

const repoRoot = resolveYoaoRepoRoot("sync-openapi");
const src = resolve(repoRoot, "apps/api/openapi.snapshot.json");
const dst = resolve(DOCS_ROOT, "public/openapi.json");

if (!existsSync(src)) {
  console.error(
    `[sync-openapi] snapshot 不存在：${src}\n` +
      `先运行：cd apps/api && uv run python ../../scripts/export_openapi.py`,
  );
  process.exit(1);
}

mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
console.log(`[sync-openapi] copied → ${dst}`);
