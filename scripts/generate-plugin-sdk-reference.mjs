#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { emitGenerated } from "./_emit.mjs";
import { DOCS_ROOT, resolvePluginSdkRepoRoot } from "./_repo-root.mjs";

const SDK_ROOT = resolvePluginSdkRepoRoot("generate-plugin-sdk-reference");
const PY_TARGET = resolve(DOCS_ROOT, "plugins/sdk/python.md");
const JS_TARGET = resolve(DOCS_ROOT, "plugins/sdk/javascript.md");

const EXTRA_NOTES = {
  "inference-runtime":
    "`yoao_plugin_sdk.inference.runtime`（LRU 池、追踪会话、受管 GPU 生命周期、`plugin_service`）",
  inference:
    "`DetectionProvider` / `create_detection_app` 作者接口与 `dev` / `check` / `build` 命令",
  mask: "`yoao_plugin_sdk.inference.mask_utils`（掩码转多边形、COCO RLE、交互提示适配）",
  qualification: "`yoao_plugin_sdk.inference.runtime.qualification_http`（环回准入验证辅助）",
  notification: "`yoao_plugin_sdk.notification` 配合异步 HTTP 客户端测试与服务",
  trainer: "声明训练器扩展点依赖边界",
  format: "声明格式适配器扩展点依赖边界",
};

const JS_EXPORT_GROUPS = [
  {
    category: "清单与推理常量",
    from: "./manifest.mjs",
    desc: "校验 `yoao-extension-manifest/v1` 五类扩展点清单（含推理 `container`/`direct` 模式）",
  },
  {
    category: "声明式主题",
    from: "./theme.mjs",
    desc: "校验 `light`/`dark` 下 `--sc-*` 语义 CSS Token，阻止注入构造",
  },
  {
    category: "鉴权辅助",
    from: "./auth.mjs",
    desc: "只读凭据及 `*_FILE` 读取，基于 `crypto.timingSafeEqual` 的恒定时间鉴权",
  },
  {
    category: "训练器协议校验",
    from: "./trainer.mjs",
    desc: "对应 `yoao-trainer/v1` 的静态/运行时契约校验",
  },
];

function parseArrayLiteral(block) {
  return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function parsePythonSdk() {
  const versionPy = readFileSync(
    resolve(SDK_ROOT, "packages/python/src/yoao_plugin_sdk/_version.py"),
    "utf8",
  );
  const version = versionPy.match(/__version__\s*=\s*"([^"]+)"/)?.[1] ?? "unknown";

  const pyproject = readFileSync(resolve(SDK_ROOT, "packages/python/pyproject.toml"), "utf8");
  const pkgName = pyproject.match(/^name\s*=\s*"([^"]+)"/m)?.[1] ?? "yoao-plugin-sdk";
  const requiresPython = pyproject.match(/^requires-python\s*=\s*"([^"]+)"/m)?.[1] ?? ">=3.10";
  const baseDepsMatch = pyproject.match(/^dependencies\s*=\s*\[([\s\S]*?)^\]/m);
  const baseDeps = baseDepsMatch ? parseArrayLiteral(baseDepsMatch[1]) : [];
  const entrypointMatch = pyproject.match(
    /\[project\.scripts\]\s*([\s\S]*?)(?:\n\[|\n*$)/,
  );
  const cliEntry = entrypointMatch?.[1].trim().replace(/\n+/g, "; ") ?? "";

  const extrasSection = pyproject.match(
    /\[project\.optional-dependencies\]\s*([\s\S]*?)\n\[/,
  )?.[1] ?? "";
  const extras = [];
  const extraRe = /^([a-z0-9-]+)\s*=\s*\[([\s\S]*?)\]/gm;
  let m;
  while ((m = extraRe.exec(extrasSection)) !== null) {
    if (m[1] === "dev") continue;
    extras.push({ name: m[1], deps: parseArrayLiteral(m[2]) });
  }

  return { pkgName, version, requiresPython, baseDeps, cliEntry, extras };
}

function renderPythonSection() {
  const { pkgName, version, requiresPython, baseDeps, cliEntry, extras } = parsePythonSdk();
  const baseDepList = baseDeps.map((d) => `\`${d}\``).join("、") || "无";
  const lines = [
    "## 包信息与可选依赖（extras）",
    "",
    `- **包名**：\`${pkgName}\`（当前版本 \`${version}\`，Python \`${requiresPython}\`，License：MIT）`,
    `- **基础依赖**：仅 ${baseDepList}，不锁定 PyTorch、TorchVision 或 OpenCV 版本`,
    `- **CLI 入口**：\`${cliEntry}\`（基础命令：\`version\`、\`validate\`、\`init\`、\`trainer check\`；推理 extra 增加 \`dev\`、\`check\`、\`build\`）`,
    "",
    "| Extra | 运行时依赖 | 适用场景与主要命名空间 |",
    "| --- | --- | --- |",
    `| 基础包（无 extra） | ${baseDepList} | \`yoao_plugin_sdk.{manifest,auth,cli,inference,trainer,notification,format_adapter}\` |`,
  ];

  for (const ex of extras) {
    const depCol = ex.deps.length ? ex.deps.map((d) => `\`${d}\``).join(", ") : "无额外运行时依赖";
    const desc = EXTRA_NOTES[ex.name] ?? ex.name;
    lines.push(`| \`[${ex.name}]\` | ${depCol} | ${desc} |`);
  }
  return { content: lines.join("\n"), version, extraCount: extras.length };
}

function parseJsSdk() {
  const pkg = JSON.parse(readFileSync(resolve(SDK_ROOT, "packages/js/package.json"), "utf8"));
  const indexMjs = readFileSync(resolve(SDK_ROOT, "packages/js/src/index.mjs"), "utf8");
  const exportsBySource = new Map();
  const exportRe = /export\s*\{([\s\S]*?)\}\s*from\s*"([^"]+)";/g;
  let m;
  while ((m = exportRe.exec(indexMjs)) !== null) {
    const symbols = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    exportsBySource.set(m[2], symbols);
  }
  return { pkg, exportsBySource };
}

function renderJsSection() {
  const { pkg, exportsBySource } = parseJsSdk();
  const binCmd = Object.keys(pkg.bin ?? {})[0] ?? "yoao-plugin-js";
  const binPath = pkg.bin?.[binCmd] ?? "./src/cli.mjs";
  const lines = [
    "## 包信息与导出符号",
    "",
    `- **包名**：\`${pkg.name}\`（当前版本 \`${pkg.version}\`，Node.js \`${pkg.engines?.node ?? ">=20.0.0"}\`，License：${pkg.license ?? "MIT"}）`,
    "- **包类型**：零运行时依赖纯 ESM + `.d.ts`",
    `- **CLI 命令**：\`${binCmd}\`（\`${binPath}\`，子命令：\`validate\`、\`validate-theme\`）`,
    "",
    "| 分类 | 导出符号 | 说明 |",
    "| --- | --- | --- |",
  ];

  let symbolCount = 0;
  for (const group of JS_EXPORT_GROUPS) {
    const syms = exportsBySource.get(group.from) ?? [];
    symbolCount += syms.length;
    lines.push(
      `| ${group.category} | ${syms.map((s) => `\`${s}\``).join(", ")} | ${group.desc} |`,
    );
  }
  return { content: lines.join("\n"), version: pkg.version, symbolCount };
}

function spliceMarker(fileText, startMarker, endMarker, body, fileLabel) {
  const startIdx = fileText.indexOf(startMarker);
  const endIdx = fileText.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error(`[generate-plugin-sdk-reference] ${fileLabel} 缺少有效标记 ${startMarker} / ${endMarker}`);
    process.exit(1);
  }
  return `${fileText.slice(0, startIdx + startMarker.length)}\n\n${body}\n\n${fileText.slice(endIdx)}`;
}

const py = renderPythonSection();
const pyUpdated = spliceMarker(
  readFileSync(PY_TARGET, "utf8"),
  "<!-- plugin-sdk-python:start -->",
  "<!-- plugin-sdk-python:end -->",
  py.content,
  "plugins/sdk/python.md",
);
emitGenerated({
  dst: PY_TARGET,
  content: pyUpdated,
  label: "generate-plugin-sdk-python",
  detail: `v${py.version}, ${py.extraCount} extras`,
});

const js = renderJsSection();
const jsUpdated = spliceMarker(
  readFileSync(JS_TARGET, "utf8"),
  "<!-- plugin-sdk-js:start -->",
  "<!-- plugin-sdk-js:end -->",
  js.content,
  "plugins/sdk/javascript.md",
);
emitGenerated({
  dst: JS_TARGET,
  content: jsUpdated,
  label: "generate-plugin-sdk-js",
  detail: `v${js.version}, ${js.symbolCount} exports`,
});
