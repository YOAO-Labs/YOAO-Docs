#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { emitGenerated } from "./_emit.mjs";
import { DOCS_ROOT, resolvePluginsRepoRoot } from "./_repo-root.mjs";

const PLUGINS_ROOT = resolvePluginsRepoRoot("generate-plugin-catalog");
const TARGET = resolve(DOCS_ROOT, "plugins/official/index.md");
const START = "<!-- plugin-catalog:start -->";
const END = "<!-- plugin-catalog:end -->";

const INFERENCE_META = {
  yolo: {
    tasks: "`detect` / `segment` / `pose` / `obb` / 开放词汇 / 追踪",
    runtime: "`ultralytics==8.4.183`",
    label: "YOLO",
    order: 1,
  },
  "grounded-sam2": {
    tasks: "开放词汇检测、交互式分割、视频跟踪",
    runtime: "GroundingDINO + SAM 2.1",
    label: "Grounded-SAM2",
    order: 2,
  },
  sam3: {
    tasks: "PCS 开放词汇检测/分割、交互分割、PVS 视频跟踪",
    runtime: "`sam3` + CUDA 12.8",
    label: "SAM3",
    order: 3,
  },
  libreyolo: {
    tasks: "目标检测（YOLOv9 t/s/m/c 及受控训练权重）",
    runtime: "`libreyolo==1.6.0`",
    label: "LibreYOLO",
    order: 4,
  },
  rapidocr: {
    tasks: "OCR 检测、方向校正与识别（PP-OCRv5/v6）",
    runtime: "`rapidocr==3.9.0` + ONNX Runtime `1.23.2`",
    label: "RapidOCR",
    order: 5,
  },
  onnxtools: {
    tasks: "车辆检测、属性分类与两阶段复合管道",
    runtime: "`onnxtools` + ONNX Runtime `1.22.0`",
    label: "ONNXTools",
    order: 6,
  },
};

const TRAINER_META = {
  ultralytics: { label: "Ultralytics 训练器", order: 1 },
  libreyolo: { label: "LibreYOLO 训练器", order: 2 },
};

const OTHER_LABELS = {
  "notification-channel/feishu-dm": "飞书私信",
  "format-adapter/labelme-json": "LabelMe JSON",
};

function parsePyprojectProject(text) {
  const sectionMatch = text.match(/\[project\]([\s\S]*?)(?:\n\[[^\[]|\n*$)/);
  const block = sectionMatch ? sectionMatch[1] : text;
  const get = (key) => block.match(new RegExp(`^${key}\\s*=\\s*["']([^"']+)["']`, "m"))?.[1] ?? "";
  return {
    name: get("name"),
    version: get("version"),
    description: get("description"),
    requiresPython: get("requires-python"),
  };
}

function listSubdirs(rel) {
  const dir = resolve(PLUGINS_ROOT, rel);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function renderCatalogBlock() {
  const lines = [];

  const infSlugs = listSubdirs("plugins/inference").sort(
    (a, b) => (INFERENCE_META[a]?.order ?? 99) - (INFERENCE_META[b]?.order ?? 99) || a.localeCompare(b),
  );
  lines.push(`## 官方推理插件（${infSlugs.length} 个）`, "");
  lines.push("| 插件包 | 插件目录 | 任务与核心能力 | Python 与核心运行时 | 详细说明 |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const slug of infSlugs) {
    const dir = resolve(PLUGINS_ROOT, "plugins/inference", slug);
    const pyproj = existsSync(resolve(dir, "pyproject.toml"))
      ? parsePyprojectProject(readFileSync(resolve(dir, "pyproject.toml"), "utf8"))
      : {};
    const manifest = readJsonIfExists(resolve(dir, "manifest.json"));
    const pkgName = pyproj.name || manifest?.plugin_id || slug;
    const version = manifest?.version || pyproj.version || "-";
    const meta = INFERENCE_META[slug];
    const tasks = meta?.tasks || pyproj.description || "-";
    const pyReq = pyproj.requiresPython ? `Python \`${pyproj.requiresPython}\`` : "Python";
    const runtime = meta?.runtime ? `${pyReq}，${meta.runtime}` : pyReq;
    const linkLabel = meta?.label || slug;
    lines.push(
      `| \`${pkgName}\` (\`${version}\`) | \`plugins/inference/${slug}\` | ${tasks} | ${runtime} | [${linkLabel}](./inference/${slug}) |`,
    );
  }
  lines.push("");

  const trainerSlugs = listSubdirs("plugins/trainer").sort(
    (a, b) => (TRAINER_META[a]?.order ?? 99) - (TRAINER_META[b]?.order ?? 99) || a.localeCompare(b),
  );
  lines.push(`## 官方训练器插件（${trainerSlugs.length} 个）`, "");
  lines.push("| `plugin_id` | 显示名称 | 框架与协议 | 声明能力 | 许可证 | 详细说明 |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const slug of trainerSlugs) {
    const manifest = readJsonIfExists(resolve(PLUGINS_ROOT, "plugins/trainer", slug, "manifest.json"));
    if (!manifest) continue;
    const ext = manifest.extension ?? {};
    const caps = (manifest.capabilities ?? []).map((c) => `\`${c}\``).join(", ");
    const linkLabel = TRAINER_META[slug]?.label || manifest.display_name || slug;
    lines.push(
      `| \`${manifest.plugin_id}\` | ${manifest.display_name} (\`${manifest.version}\`) | \`${ext.framework_id}\` \`${ext.framework_version}\` (\`${manifest.protocol_version}\`) | ${caps} | \`${manifest.license}\` | [${linkLabel}](./trainer/${slug}) |`,
    );
  }
  lines.push("");

  const otherEntries = [];
  for (const cat of ["notification-channel", "format-adapter"]) {
    for (const slug of listSubdirs(`plugins/${cat}`)) {
      const manifest = readJsonIfExists(resolve(PLUGINS_ROOT, "plugins", cat, slug, "manifest.json"));
      if (manifest) otherEntries.push({ cat, slug, manifest });
    }
  }
  lines.push(`## 官方通知渠道与格式适配器（${otherEntries.length} 个）`, "");
  lines.push("| 扩展点 | `plugin_id` | 显示名称 | 协议与运行时 | 能力与出站限制 | 详细说明 |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const { cat, slug, manifest } of otherEntries) {
    const ext = manifest.extension ?? {};
    const caps = (manifest.capabilities ?? []).map((c) => `\`${c}\``).join(", ");
    const hosts = Array.isArray(ext.allowed_egress_hosts)
      ? ext.allowed_egress_hosts.length
        ? `出站仅 \`${ext.allowed_egress_hosts.join("`, `")}\``
        : "无外部出站 `[]`"
      : "-";
    const runtime = manifest.entrypoint?.[0] === "node" ? "Node.js >=20" : "Python";
    const linkLabel = OTHER_LABELS[`${cat}/${slug}`] || manifest.display_name || slug;
    lines.push(
      `| \`${manifest.extension_point}\` | \`${manifest.plugin_id}\` | ${manifest.display_name} (\`${manifest.version}\`) | \`${manifest.protocol_version}\`，${runtime} | ${caps}（${hosts}） | [${linkLabel}](./${cat}/${slug}) |`,
    );
  }

  return lines.join("\n");
}

function spliceMarker(fileText, startMarker, endMarker, body, fileLabel) {
  const startIdx = fileText.indexOf(startMarker);
  const endIdx = fileText.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error(`[generate-plugin-catalog] ${fileLabel} 缺少有效标记 ${startMarker} / ${endMarker}`);
    process.exit(1);
  }
  const before = fileText.slice(0, startIdx + startMarker.length);
  const after = fileText.slice(endIdx);
  return `${before}\n\n${body}\n\n${after}`;
}

const current = readFileSync(TARGET, "utf8");
const rendered = renderCatalogBlock();
const updated = spliceMarker(current, START, END, rendered, "plugins/official/index.md");

emitGenerated({
  dst: TARGET,
  content: updated,
  label: "generate-plugin-catalog",
  detail: "YOAO-Plugins 10 plugins",
});
