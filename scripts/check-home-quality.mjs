#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const USAGE =
  "Usage: node scripts/check-home-quality.mjs <url> [--route /] [--json] " +
  "[--max-dom-nodes N] [--max-svg-nodes N] [--max-scroll-height N] " +
  "[--max-transfer-bytes N] [--max-media-bytes N] [--max-initial-video-requests N] " +
  "[--expect-sections a,b,c]";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "tablet", width: 768, height: 960 },
  { name: "mobile", width: 390, height: 844 },
];

const THEMES = [
  { name: "light", dark: false },
  { name: "dark", dark: true },
];

function parseNonNegativeNumber(flag, raw) {
  if (raw === undefined || raw.startsWith("--")) {
    throw new Error(`${flag} requires a numeric value`);
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative number, got "${raw}"`);
  }
  return parsed;
}

function parseCliArgs(argv) {
  const opts = {
    url: null,
    route: null,
    json: false,
    maxDomNodes: null,
    maxSvgNodes: null,
    maxScrollHeight: null,
    maxTransferBytes: null,
    maxMediaBytes: null,
    maxInitialVideoRequests: null,
    expectSections: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--json":
        opts.json = true;
        break;
      case "--route": {
        const val = argv[++i];
        if (!val || val.startsWith("--")) throw new Error("--route requires a path");
        opts.route = val;
        break;
      }
      case "--max-dom-nodes":
        opts.maxDomNodes = parseNonNegativeNumber(arg, argv[++i]);
        break;
      case "--max-svg-nodes":
        opts.maxSvgNodes = parseNonNegativeNumber(arg, argv[++i]);
        break;
      case "--max-scroll-height":
        opts.maxScrollHeight = parseNonNegativeNumber(arg, argv[++i]);
        break;
      case "--max-transfer-bytes":
        opts.maxTransferBytes = parseNonNegativeNumber(arg, argv[++i]);
        break;
      case "--max-media-bytes":
        opts.maxMediaBytes = parseNonNegativeNumber(arg, argv[++i]);
        break;
      case "--max-initial-video-requests":
        opts.maxInitialVideoRequests = parseNonNegativeNumber(arg, argv[++i]);
        break;
      case "--expect-sections": {
        const val = argv[++i];
        if (!val || val.startsWith("--")) {
          throw new Error("--expect-sections requires a comma-separated list");
        }
        opts.expectSections = val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (opts.expectSections.length === 0) {
          throw new Error("--expect-sections cannot be empty");
        }
        break;
      }
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}\n${USAGE}`);
        }
        if (opts.url !== null) {
          throw new Error(`Unexpected extra argument: ${arg}\n${USAGE}`);
        }
        opts.url = arg;
    }
  }

  if (!opts.url) {
    throw new Error(`Missing target URL.\n${USAGE}`);
  }

  const target = resolveTargetUrl(opts.url, opts.route);
  return { ...opts, targetUrl: target };
}

function resolveTargetUrl(inputUrl, route) {
  const parsed = new URL(inputUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Target URL must use http or https, got "${parsed.protocol}"`);
  }
  if (!route) return parsed.href;

  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  if (normalizedRoute === "/") {
    return parsed.href;
  }

  const trimmedPath = parsed.pathname.replace(/\/+$/, "");
  const trimmedRoute = normalizedRoute.replace(/\/+$/, "");
  if (trimmedPath.endsWith(trimmedRoute)) {
    return parsed.href;
  }

  const baseHref = parsed.href.endsWith("/") ? parsed.href : `${parsed.href}/`;
  return new URL(normalizedRoute.replace(/^\/+/, ""), baseHref).href;
}

function createBrowser(session) {
  return function browser(...args) {
    const raw = execFileSync("agent-browser", ["--session", session, "--json", ...args], {
      encoding: "utf8",
      timeout: 60_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const response = JSON.parse(raw);
    if (!response.success) {
      throw new Error(`agent-browser ${args.join(" ")} failed: ${JSON.stringify(response.error)}`);
    }
    return response.data;
  };
}

function normalizeConsoleErrors(consoleData) {
  const list = Array.isArray(consoleData?.messages)
    ? consoleData.messages
    : Array.isArray(consoleData)
      ? consoleData
      : [];
  return list
    .filter((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const level = String(entry.type ?? entry.level ?? "").toLowerCase();
      return level === "error";
    })
    .map((entry) => String(entry.text ?? entry.message ?? JSON.stringify(entry)));
}

function normalizePageErrors(errorsData) {
  const list = Array.isArray(errorsData?.errors)
    ? errorsData.errors
    : Array.isArray(errorsData)
      ? errorsData
      : [];
  return list.map((entry) =>
    typeof entry === "string" ? entry : String(entry.message ?? entry.text ?? JSON.stringify(entry)),
  );
}

function checkMaxThreshold(failures, name, observed, limit) {
  if (limit === null) return;
  if (observed > limit) {
    failures.push(
      `${name} exceeded threshold: observed ${observed} > max ${limit} (+${observed - limit})`,
    );
  }
}

function run() {
  const opts = parseCliArgs(process.argv.slice(2));
  const session = `home-quality-${process.pid}`;
  const browser = createBrowser(session);
  let browserOpened = false;

  try {
    browser("set", "viewport", "1440", "960");
    browserOpened = true;
    browser("open", opts.targetUrl);
    browser(
      "wait",
      "--fn",
      "document.readyState === 'complete' && !!(document.querySelector('.docs-home') || document.querySelector('.yoao-playground') || document.querySelector('#app > *'))",
    );
    browser(
      "wait",
      "--fn",
      `(() => {
        const sim = document.querySelector('[data-hero-simulator]');
        if (!sim) return true;
        const parent = sim.parentElement;
        return !parent || Number(getComputedStyle(parent).opacity) >= 0.99;
      })()`,
    );

    const initialMetrics = browser(
      "eval",
      `(() => {
        const navEntries = performance.getEntriesByType('navigation');
        const resEntries = performance.getEntriesByType('resource');
        const allEntries = [...navEntries, ...resEntries];
        const byteSize = (entry) => entry.transferSize || entry.encodedBodySize || 0;
        const transferTotalBytes = allEntries.reduce((sum, entry) => sum + byteSize(entry), 0);

        const mediaRe = /\\.(webp|png|jpe?g|gif|avif|mp4|webm|ogg)(\\?|$)/i;
        const videoRe = /\\.(mp4|webm|ogg|m3u8)(\\?|$)/i;
        const initialMediaBytes = resEntries
          .filter((entry) => mediaRe.test(entry.name))
          .reduce((sum, entry) => sum + byteSize(entry), 0);
        const initialVideoRequests = resEntries.filter((entry) => videoRe.test(entry.name)).length;

        const sim = document.querySelector('[data-hero-simulator]');
        const heroSimulatorRect = sim
          ? (() => {
              const r = sim.getBoundingClientRect();
              return {
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                left: Math.round(r.left),
                right: Math.round(r.right),
                width: Math.round(r.width),
                height: Math.round(r.height),
              };
            })()
          : null;

        return {
          domNodes: document.querySelectorAll('*').length,
          svgNodes: document.querySelectorAll('svg *').length,
          scrollHeight: document.documentElement.scrollHeight,
          transferTotalBytes,
          initialMediaBytes,
          initialVideoRequests,
          heroSimulatorRect,
          sectionIds: [...document.querySelectorAll('section[id]')].map((el) => el.id),
        };
      })()`,
    ).result;

    const viewportChecks = [];
    for (const theme of THEMES) {
      browser("eval", `document.documentElement.classList.toggle('dark', ${theme.dark})`);
      for (const vp of VIEWPORTS) {
        browser("set", "viewport", String(vp.width), String(vp.height));
        const layout = browser(
          "eval",
          `(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            scrollHeight: document.documentElement.scrollHeight,
            overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          }))()`,
        ).result;
        viewportChecks.push({
          viewport: `${vp.width}x${vp.height}`,
          theme: theme.name,
          ...layout,
        });
      }
    }

    browser("eval", "document.documentElement.classList.toggle('dark', false)");
    browser("set", "viewport", "1440", "960");
    browser("eval", "window.scrollTo(0, 0)");

    const visibleTabs = browser(
      "eval",
      `(() => {
        const tabs = [...document.querySelectorAll('[role="tab"]')];
        const visible = [];
        let idx = 0;
        for (const el of tabs) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
            el.setAttribute('data-hq-tab-idx', String(idx));
            visible.push({
              index: idx,
              label: el.textContent.replace(/\\s+/g, ' ').trim().slice(0, 80),
            });
            idx += 1;
          }
        }
        return visible;
      })()`,
    ).result;

    const tabClickChecks = [];
    for (const tab of visibleTabs) {
      const selector = `[data-hq-tab-idx="${tab.index}"]`;
      browser("scrollintoview", selector);
      browser("click", selector);
      const state = browser(
        "eval",
        `(() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { found: false, ariaSelected: null, dataState: null, active: false };
          const ariaSelected = el.getAttribute('aria-selected');
          const dataState = el.getAttribute('data-state');
          return {
            found: true,
            ariaSelected,
            dataState,
            active: ariaSelected === 'true' || dataState === 'active',
          };
        })()`,
      ).result;
      tabClickChecks.push({
        index: tab.index,
        label: tab.label,
        ...state,
      });
    }

    browser(
      "eval",
      "for (const el of document.querySelectorAll('[data-hq-tab-idx]')) el.removeAttribute('data-hq-tab-idx')",
    );

    const pageErrors = normalizePageErrors(browser("errors"));
    const consoleErrors = normalizeConsoleErrors(browser("console"));

    const failures = [];
    for (const vp of viewportChecks) {
      if (vp.overflow) {
        failures.push(
          `horizontal overflow at ${vp.viewport} ${vp.theme}: scrollWidth ${vp.scrollWidth} > innerWidth ${vp.innerWidth} (+${vp.scrollWidth - vp.innerWidth})`,
        );
      }
    }

    if (pageErrors.length > 0) {
      failures.push(`uncaught page errors (${pageErrors.length}): ${pageErrors.join("; ")}`);
    }
    if (consoleErrors.length > 0) {
      failures.push(`console errors (${consoleErrors.length}): ${consoleErrors.join("; ")}`);
    }

    for (const tab of tabClickChecks) {
      if (!tab.active) {
        failures.push(
          `tab click failed [${tab.index} "${tab.label}"]: aria-selected=${JSON.stringify(tab.ariaSelected)}, data-state=${JSON.stringify(tab.dataState)}`,
        );
      }
    }

    checkMaxThreshold(failures, "domNodes", initialMetrics.domNodes, opts.maxDomNodes);
    checkMaxThreshold(failures, "svgNodes", initialMetrics.svgNodes, opts.maxSvgNodes);
    checkMaxThreshold(failures, "scrollHeight", initialMetrics.scrollHeight, opts.maxScrollHeight);
    checkMaxThreshold(
      failures,
      "transferTotalBytes",
      initialMetrics.transferTotalBytes,
      opts.maxTransferBytes,
    );
    checkMaxThreshold(
      failures,
      "initialMediaBytes",
      initialMetrics.initialMediaBytes,
      opts.maxMediaBytes,
    );
    checkMaxThreshold(
      failures,
      "initialVideoRequests",
      initialMetrics.initialVideoRequests,
      opts.maxInitialVideoRequests,
    );

    if (opts.expectSections !== null) {
      const expected = opts.expectSections.join(",");
      const observed = initialMetrics.sectionIds.join(",");
      if (expected !== observed) {
        failures.push(
          `sectionIds mismatch: expected [${expected}], observed [${observed}]`,
        );
      }
    }

    const report = {
      url: opts.targetUrl,
      ok: failures.length === 0,
      ...initialMetrics,
      tabClickChecks,
      viewportChecks,
      consoleErrors,
      pageErrors,
      failures,
    };

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        `[check-home-quality] ${report.ok ? "PASS" : "FAIL"} ${report.url}\n` +
          `  domNodes=${report.domNodes} svgNodes=${report.svgNodes} scrollHeight=${report.scrollHeight}px\n` +
          `  transferTotalBytes=${report.transferTotalBytes} initialMediaBytes=${report.initialMediaBytes} initialVideoRequests=${report.initialVideoRequests}\n` +
          `  sections=[${report.sectionIds.join(", ")}] tabsChecked=${report.tabClickChecks.length}`,
      );
    }

    if (failures.length > 0) {
      for (const failure of failures) {
        console.error(`[check-home-quality] FAIL: ${failure}`);
      }
      process.exitCode = 1;
    }
  } finally {
    if (browserOpened) {
      try {
        browser("close");
      } catch {}
    }
  }
}

try {
  run();
} catch (error) {
  console.error(`[check-home-quality] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
