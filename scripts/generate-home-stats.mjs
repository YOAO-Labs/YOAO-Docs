#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { emitGenerated } from "./_emit.mjs";

const __here = dirname(fileURLToPath(import.meta.url));
export const DOCS_ROOT = resolve(__here, "..");
export const OUTPUT_REL_PATH = ".vitepress/theme/generated/home-stats.generated.json";

const DOC_SECTIONS = ["user-guide", "plugins", "api", "sdk", "dev", "ops"];
const DOC_SKIP_RE =
  /(^|\/)(changelog|redirects|_sources|_yoao-source)\/|_routes\.generated|\/examples\//;
const TABLE_SEP_RE = /^\|(?:\s*:?-{3,}:?\s*\|)+$/;

function readRequiredFile(docsRoot, relPath) {
  const abs = join(docsRoot, relPath);
  if (!existsSync(abs)) {
    throw new Error(`[generate-home-stats] Missing required source file: ${relPath} (${abs})`);
  }
  return readFileSync(abs, "utf8");
}

function assertPositiveInt(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`[generate-home-stats] Invalid ${label}: expected positive integer, got ${value}`);
  }
  return value;
}

function parseTableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function extractTableDataRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const rows = [];
  let inBody = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!inBody) {
      if (trimmed.startsWith("|") && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1].trim())) {
        inBody = true;
        i += 1;
      }
      continue;
    }
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
      inBody = false;
      continue;
    }
    rows.push(parseTableCells(trimmed));
  }

  return rows;
}

function parseApiRouteStats(docsRoot) {
  const raw = readRequiredFile(docsRoot, "api/guides/_routes.generated.md");
  const match = raw.match(/_共\s+(\d+)\s+模块\s*\/\s*(\d+)\s+路由_/);
  if (!match) {
    throw new Error(
      "[generate-home-stats] Could not parse module/route summary in api/guides/_routes.generated.md",
    );
  }
  const apiModules = assertPositiveInt(Number(match[1]), "apiModules");
  const apiRoutes = assertPositiveInt(Number(match[2]), "apiRoutes");
  return { apiModules, apiRoutes };
}

function parseOfficialPlugins(docsRoot) {
  const raw = readRequiredFile(docsRoot, "plugins/official/index.md");
  const startMarker = "<!-- plugin-catalog:start -->";
  const endMarker = "<!-- plugin-catalog:end -->";
  const startIdx = raw.indexOf(startMarker);
  const endIdx = raw.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error(
      "[generate-home-stats] Missing plugin-catalog markers in plugins/official/index.md",
    );
  }

  const catalogBlock = raw.slice(startIdx + startMarker.length, endIdx);
  const sections = catalogBlock
    .split(/^##\s+/m)
    .slice(1)
    .map((chunk) => {
      const newlineIdx = chunk.indexOf("\n");
      const heading = (newlineIdx === -1 ? chunk : chunk.slice(0, newlineIdx)).trim();
      const body = newlineIdx === -1 ? "" : chunk.slice(newlineIdx + 1);
      return { heading, rows: extractTableDataRows(body) };
    });

  const inferenceSec = sections.find((s) => /推理/.test(s.heading));
  const trainerSec = sections.find((s) => /训练/.test(s.heading));
  const otherSec = sections.find((s) => /通知|格式/.test(s.heading));

  if (!inferenceSec || !trainerSec || !otherSec) {
    throw new Error(
      "[generate-home-stats] Expected inference, trainer, and notification/format sections in plugins/official/index.md",
    );
  }

  const inference = assertPositiveInt(inferenceSec.rows.length, "officialPlugins.inference");
  const trainer = assertPositiveInt(trainerSec.rows.length, "officialPlugins.trainer");

  let notificationChannel = 0;
  let formatAdapter = 0;
  for (const cells of otherSec.rows) {
    const extId = (cells[0] ?? "").replace(/`/g, "").trim();
    if (extId === "notification_channel") {
      notificationChannel += 1;
    } else if (extId === "format_adapter") {
      formatAdapter += 1;
    } else {
      throw new Error(
        `[generate-home-stats] Unexpected extension point "${extId}" in plugins/official/index.md`,
      );
    }
  }

  assertPositiveInt(notificationChannel, "officialPlugins.notificationChannel");
  assertPositiveInt(formatAdapter, "officialPlugins.formatAdapter");

  const total = assertPositiveInt(
    inference + trainer + notificationChannel + formatAdapter,
    "officialPlugins.total",
  );

  return {
    total,
    inference,
    trainer,
    notificationChannel,
    formatAdapter,
  };
}

function parseExtensionPoints(docsRoot) {
  const raw = readRequiredFile(docsRoot, "plugins/index.md");
  const headingMatch = raw.match(/^##\s+五大扩展点与协议\s*$/m);
  if (!headingMatch || headingMatch.index === undefined) {
    throw new Error(
      '[generate-home-stats] Missing "五大扩展点与协议" section in plugins/index.md',
    );
  }

  const afterHeading = raw.slice(headingMatch.index + headingMatch[0].length);
  const nextHeading = afterHeading.match(/^##\s+/m);
  const sectionBody =
    nextHeading && nextHeading.index !== undefined
      ? afterHeading.slice(0, nextHeading.index)
      : afterHeading;

  const rows = extractTableDataRows(sectionBody);
  const extensionPointIds = [];
  const seen = new Set();

  for (const cells of rows) {
    const idMatch = (cells[0] ?? "").match(/`([a-z][a-z0-9_]*)`/);
    if (!idMatch) {
      throw new Error(
        `[generate-home-stats] Could not parse extension point id from row cell "${cells[0] ?? ""}" in plugins/index.md`,
      );
    }
    const id = idMatch[1];
    if (seen.has(id)) {
      throw new Error(`[generate-home-stats] Duplicate extension point id "${id}" in plugins/index.md`);
    }
    seen.add(id);
    extensionPointIds.push(id);
  }

  const extensionPoints = assertPositiveInt(extensionPointIds.length, "extensionPoints");
  return { extensionPoints, extensionPointIds };
}

function countDocPages(docsRoot) {
  let count = 0;

  for (const section of DOC_SECTIONS) {
    const absSection = join(docsRoot, section);
    if (!existsSync(absSection) || !statSync(absSection).isDirectory()) {
      throw new Error(
        `[generate-home-stats] Missing required documentation directory: ${section} (${absSection})`,
      );
    }

    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const entryPath = join(dir, name);
        const st = statSync(entryPath);
        if (st.isDirectory()) {
          walk(entryPath);
        } else if (name.endsWith(".md")) {
          const relPosix = relative(docsRoot, entryPath).replace(/\\/g, "/");
          if (!DOC_SKIP_RE.test(relPosix)) {
            count += 1;
          }
        }
      }
    };

    walk(absSection);
  }

  return assertPositiveInt(count, "docPages");
}

export function collectHomeStats(docsRoot = DOCS_ROOT) {
  const { apiRoutes, apiModules } = parseApiRouteStats(docsRoot);
  const docPages = countDocPages(docsRoot);
  const { extensionPoints, extensionPointIds } = parseExtensionPoints(docsRoot);
  const officialPlugins = parseOfficialPlugins(docsRoot);

  return {
    apiRoutes,
    apiModules,
    docPages,
    extensionPoints,
    extensionPointIds,
    officialPlugins,
  };
}

export function formatHomeStats(stats) {
  return `${JSON.stringify(stats, null, 2)}\n`;
}

function parseCliRoot(argv) {
  const idx = argv.indexOf("--root");
  if (idx === -1) return DOCS_ROOT;
  const value = argv[idx + 1];
  if (!value || value.startsWith("-")) {
    throw new Error("[generate-home-stats] --root requires a directory path");
  }
  return resolve(value);
}

const isDirectExecution =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  const root = parseCliRoot(process.argv.slice(2));
  const stats = collectHomeStats(root);
  const dst = resolve(root, OUTPUT_REL_PATH);
  emitGenerated({
    dst,
    content: formatHomeStats(stats),
    label: "generate-home-stats",
    detail: `${stats.apiRoutes} routes, ${stats.officialPlugins.total} official plugins, ${stats.extensionPoints} extension points, ${stats.docPages} doc pages`,
  });
}
