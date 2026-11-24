import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const DOCS_ROOT = resolve(here, "..");

export function resolveYoaoRepoRoot(callerName = "docs-script") {
  const candidate = process.env.YOAO_REPO_PATH
    ? resolve(process.env.YOAO_REPO_PATH)
    : resolve(DOCS_ROOT, "../YOAO");
  if (!existsSync(candidate)) {
    console.error(
      `[${callerName}] 未找到主仓库目录：${candidate}\n` +
        `请设置环境变量 YOAO_REPO_PATH=/path/to/YOAO 后重试。`,
    );
    process.exit(1);
  }
  return candidate;
}
