import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  DOCS_ROOT,
  OUTPUT_REL_PATH,
  collectHomeStats,
  formatHomeStats,
} from "./generate-home-stats.mjs";

const SCRIPT_PATH = fileURLToPath(new URL("./generate-home-stats.mjs", import.meta.url));

function createFixtureRoot(t) {
  const dir = mkdtempSync(join(tmpdir(), "yoao-home-stats-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  for (const section of ["user-guide", "plugins", "api", "sdk", "dev", "ops"]) {
    mkdirSync(join(dir, section), { recursive: true });
    writeFileSync(join(dir, section, "index.md"), `# ${section}\n`);
  }
  mkdirSync(join(dir, "api/guides"), { recursive: true });
  mkdirSync(join(dir, "plugins/official"), { recursive: true });

  cpSync(
    resolve(DOCS_ROOT, "api/guides/_routes.generated.md"),
    join(dir, "api/guides/_routes.generated.md"),
  );
  cpSync(
    resolve(DOCS_ROOT, "plugins/official/index.md"),
    join(dir, "plugins/official/index.md"),
  );
  cpSync(resolve(DOCS_ROOT, "plugins/index.md"), join(dir, "plugins/index.md"));

  return dir;
}

test("collectHomeStats extracts verified positive counts from the repository", () => {
  const stats = collectHomeStats(DOCS_ROOT);

  assert.equal(stats.apiRoutes, 783);
  assert.equal(stats.apiModules, 121);
  assert.equal(stats.docPages, 275);
  assert.equal(stats.extensionPoints, 5);
  assert.deepEqual(stats.extensionPointIds, [
    "inference",
    "trainer",
    "notification_channel",
    "format_adapter",
    "theme",
  ]);
  assert.deepEqual(stats.officialPlugins, {
    total: 10,
    inference: 6,
    trainer: 2,
    notificationChannel: 1,
    formatAdapter: 1,
  });

  const json = formatHomeStats(stats);
  assert.ok(json.endsWith("\n"));
  assert.deepEqual(JSON.parse(json), stats);
});

test("CLI --check passes on synced output and exits non-zero on drift", (t) => {
  const fixtureRoot = createFixtureRoot(t);
  const runCli = (...args) =>
    spawnSync(process.execPath, [SCRIPT_PATH, "--root", fixtureRoot, ...args], {
      encoding: "utf8",
    });

  const generate = runCli();
  assert.equal(generate.status, 0, generate.stderr);

  const generatedPath = resolve(fixtureRoot, OUTPUT_REL_PATH);
  const syncedContent = readFileSync(generatedPath, "utf8");

  const checkSynced = runCli("--check");
  assert.equal(checkSynced.status, 0, checkSynced.stderr);

  const drifted = JSON.parse(syncedContent);
  drifted.apiRoutes = 999;
  writeFileSync(generatedPath, `${JSON.stringify(drifted, null, 2)}\n`);

  const checkDrifted = runCli("--check");
  assert.equal(checkDrifted.status, 1, "Expected --check to fail on drifted generated JSON");
  assert.match(checkDrifted.stderr, /与源不一致/);
  assert.equal(readFileSync(generatedPath, "utf8"), `${JSON.stringify(drifted, null, 2)}\n`);

  const resync = runCli();
  assert.equal(resync.status, 0, resync.stderr);
  assert.equal(readFileSync(generatedPath, "utf8"), syncedContent);

  const checkAgain = runCli("--check");
  assert.equal(checkAgain.status, 0, checkAgain.stderr);
});

test("missing or malformed source files fail explicitly instead of emitting 0", (t) => {
  const missingRoutes = createFixtureRoot(t);
  rmSync(join(missingRoutes, "api/guides/_routes.generated.md"));
  assert.throws(() => collectHomeStats(missingRoutes), /Missing required source file/);

  const zeroRoutes = createFixtureRoot(t);
  writeFileSync(join(zeroRoutes, "api/guides/_routes.generated.md"), "_共 0 模块 / 0 路由_\n");
  assert.throws(() => collectHomeStats(zeroRoutes), /Invalid apiModules/);

  const missingCatalog = createFixtureRoot(t);
  writeFileSync(join(missingCatalog, "plugins/official/index.md"), "# Empty\n");
  assert.throws(() => collectHomeStats(missingCatalog), /Missing plugin-catalog markers/);

  const emptyExtensionTable = createFixtureRoot(t);
  writeFileSync(
    join(emptyExtensionTable, "plugins/index.md"),
    "# 插件生态\n\n## 五大扩展点与协议\n\n| 扩展点 | 协议标识 |\n| --- | --- |\n",
  );
  assert.throws(() => collectHomeStats(emptyExtensionTable), /Invalid extensionPoints/);

  const missingDocDir = createFixtureRoot(t);
  rmSync(join(missingDocDir, "ops"), { recursive: true, force: true });
  assert.throws(() => collectHomeStats(missingDocDir), /Missing required documentation directory/);

  const cliFail = spawnSync(process.execPath, [SCRIPT_PATH, "--root", missingRoutes], {
    encoding: "utf8",
  });
  assert.notEqual(cliFail.status, 0);
});
