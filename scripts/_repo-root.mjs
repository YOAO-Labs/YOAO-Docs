import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const DOCS_ROOT = resolve(here, "..");

function resolveRepo(envVar, candidates, callerName, repoLabel, examplePath) {
  const override = process.env[envVar];
  if (override) {
    const abs = resolve(override);
    if (!existsSync(abs)) {
      console.error(`[${callerName}] ${envVar} 指向的目录不存在：${abs}`);
      process.exit(1);
    }
    return abs;
  }
  for (const rel of candidates) {
    const candidate = resolve(DOCS_ROOT, rel);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  console.error(
    `[${callerName}] 未找到 ${repoLabel} 目录。\n` +
      `请设置环境变量 ${envVar}=${examplePath} 后重试。`,
  );
  process.exit(1);
}

export function resolveYoaoRepoRoot(callerName = "docs-script") {
  return resolveRepo(
    "YOAO_REPO_PATH",
    ["_sources/YOAO", "_yoao-source", "../YOAO", "../ai-annotation-platform/dev"],
    callerName,
    "YOAO 主仓库",
    "/path/to/YOAO",
  );
}

export function resolvePluginsRepoRoot(callerName = "docs-script") {
  return resolveRepo(
    "YOAO_PLUGINS_REPO_PATH",
    ["_sources/YOAO-Plugins", "../YOAO-Plugins", "../YOAO-plugins/main"],
    callerName,
    "YOAO-Plugins 仓库",
    "/path/to/YOAO-Plugins",
  );
}

export function resolvePluginSdkRepoRoot(callerName = "docs-script") {
  return resolveRepo(
    "YOAO_PLUGIN_SDK_REPO_PATH",
    ["_sources/Plugin-SDK", "../Plugin-SDK", "../Plugin-SDK/main"],
    callerName,
    "Plugin-SDK 仓库",
    "/path/to/Plugin-SDK",
  );
}
