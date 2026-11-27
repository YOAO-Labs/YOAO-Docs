<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { withBase } from "vitepress";
import { Motion } from "motion-v";
import { TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import { ArrowUpRight, Check, Copy, Puzzle, Terminal } from "lucide-vue-next";
import FrameSection from "./FrameSection.vue";
import {
  HOME_SECTIONS,
  HOME_STATS,
  type DevSnippetSpec,
  type DevSnippetTabId,
  type ExtensionPointId,
  type ExtensionPointSpec,
} from "./home-contract";

interface RepositoryBoundary {
  readonly name: string;
  readonly role: string;
  readonly summary: string;
  readonly href: string;
}

const u = withBase;
const plug = (sub: string) => u(`/plugins/${sub}`);
const official = (sub: string) => plug(`official/${sub}`);
const panelMotion = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.16 },
} as const;

const extensionPoints: readonly [ExtensionPointSpec, ...ExtensionPointSpec[]] = [
  {
    id: "inference",
    label: "推理服务",
    protocol: "yoao-inference/v2",
    runtime: "容器（--network none 资格核验）/ D1 直连 HTTP",
    description: "以隔离容器或直连 HTTP 承载视觉推理模型，覆盖检测、分割、追踪、OCR 与复合管道。",
    officialCount: HOME_STATS.officialPlugins.inference,
    plugins: [
      { id: "yolo", name: "YOLO", summary: "detect / segment / pose / obb 与追踪", href: official("inference/yolo") },
      { id: "grounded-sam2", name: "Grounded-SAM2", summary: "开放词汇检测、交互分割与视频追踪", href: official("inference/grounded-sam2") },
      { id: "sam3", name: "SAM3", summary: "PCS 开放词汇、交互分割与 PVS 追踪", href: official("inference/sam3") },
      { id: "libreyolo", name: "LibreYOLO", summary: "YOLOv9 原生检测与受控回流权重", href: official("inference/libreyolo") },
      { id: "rapidocr", name: "RapidOCR", summary: "PP-OCRv5/v6 文本检测、方向校正与识别", href: official("inference/rapidocr") },
      { id: "onnxtools", name: "ONNXTools", summary: "车辆检测、属性分类与两阶段管道", href: official("inference/onnxtools") },
    ],
    protocolHref: plug("protocols/inference-v2"),
    manageHref: plug("manage/inference-install"),
  },
  {
    id: "trainer",
    label: "训练器",
    protocol: "yoao-trainer/v1",
    runtime: "training-supervisor 断网非 root 容器或本机白名单进程",
    description: "从冻结数据版本执行受控训练、逐样本评估与断点续训，产出回流权重与 input_membership 回执。",
    officialCount: HOME_STATS.officialPlugins.trainer,
    plugins: [
      { id: "ultralytics", name: "Ultralytics YOLO", summary: "train / evaluate / preview / export_weights", href: official("trainer/ultralytics") },
      { id: "libreyolo", name: "LibreYOLO9", summary: "MIT 许可原生 YOLO9 检测训练与回流", href: official("trainer/libreyolo") },
    ],
    protocolHref: plug("protocols/trainer-v1"),
    manageHref: plug("manage/trainer-install"),
  },
  {
    id: "notification_channel",
    label: "通知渠道",
    protocol: "yoao-notification-channel/v1",
    runtime: "Bearer 鉴权独立 HTTP 服务与 SSRF 出站白名单",
    description: "将审核、批次分派与训练完成事件投递至企业 IM 或告警渠道，并强制校验出站白名单。",
    officialCount: HOME_STATS.officialPlugins.notificationChannel,
    plugins: [
      { id: "feishu-dm", name: "飞书私信 (Feishu DM)", summary: "deliver / verify_address（仅出站 open.feishu.cn）", href: official("notification-channel/feishu-dm") },
    ],
    protocolHref: plug("protocols/notification-format-theme"),
    manageHref: official(""),
  },
  {
    id: "format_adapter",
    label: "格式适配",
    protocol: "yoao-format-adapter/v1",
    runtime: "独立 HTTP 导入导出边界，无 ORM 耦合",
    description: "在零外部出站的独立 HTTP 边界内双向转换标注格式，不耦合平台数据库与 ORM。",
    officialCount: HOME_STATS.officialPlugins.formatAdapter,
    plugins: [
      { id: "labelme-json", name: "LabelMe JSON", summary: "import / export 双向转换（零外部出站）", href: official("format-adapter/labelme-json") },
    ],
    protocolHref: plug("protocols/notification-format-theme"),
    manageHref: official(""),
  },
  {
    id: "theme",
    label: "声明式主题",
    protocol: "yoao-theme/v1",
    runtime: "静态 JSON --sc-* 语义变量包，由 @yoao/plugin-sdk 校验",
    description: "通过静态 JSON 覆盖明暗 --sc-* 语义变量定制品牌视觉，不引入运行时脚本。",
    officialCount: 0,
    plugins: [],
    protocolHref: plug("protocols/notification-format-theme"),
    manageHref: plug("sdk/javascript"),
  },
];

const repoBoundaries: readonly RepositoryBoundary[] = [
  { name: "YOAO", role: "核心平台", summary: "标注工作台、平台 API、training-supervisor 与受控调度", href: u("/dev/") },
  { name: "YOAO-Plugins", role: `${HOME_STATS.officialPlugins.total} 个官方插件`, summary: "独立锁依赖、不可变 @sha256 OCI 镜像与离线资格验收", href: official("") },
  { name: "Plugin-SDK", role: `${HOME_STATS.extensionPoints} 类扩展套件`, summary: "yoao-plugin-sdk 与 @yoao/plugin-sdk 脚手架与契约自检", href: plug("sdk/") },
];

const devSnippets: readonly [DevSnippetSpec, ...DevSnippetSpec[]] = [
  {
    id: "cli",
    label: "yoao CLI",
    language: "bash",
    summary: "不可变镜像核验、GPU 资格验收与训练实验查询",
    command: `yoao plugins inspect-image --image registry.example/sam3@sha256:8f3a... --json
yoao plugins qualify --state-dir ./plugin-state --asset-dir ./assets --json
yoao learning runs list --project "$PROJECT_ID" --json`,
    output: `{
  "manifest_version": "yoao-extension-manifest/v1",
  "plugin_id": "sam3",
  "qualification": "verified",
  "latest_run": { "id": "run_01", "status": "completed", "map50": 0.914 }
}`,
    docLabel: "查看 CLI 参考",
    docHref: u("/sdk/cli"),
  },
  {
    id: "python-sdk",
    label: "Python SDK",
    language: "python",
    summary: `同步强类型 Client，覆盖 ${HOME_STATS.apiRoutes} 条 v1 路由与在线学习`,
    command: `from yoao import Client

with Client() as client:
    projects = client.projects.list()
    runs = client.training_runs.list(projects[0].id, limit=10)`,
    output: `{
  "client": "yoao.Client (sync · extra='allow')",
  "indexed_v1_routes": ${HOME_STATS.apiRoutes},
  "projects_loaded": 4,
  "latest_run": { "framework": "ultralytics", "status": "completed" }
}`,
    docLabel: "查看 SDK 快速上手",
    docHref: u("/sdk/quickstart"),
  },
  {
    id: "plugin-sdk",
    label: "Plugin-SDK",
    language: "bash",
    summary: "脚手架初始化、清单校验与 CPU 离线契约自检",
    command: `yoao-plugin init --type trainer --example ./my-trainer
yoao-plugin validate ./my-trainer/manifest.json
yoao-plugin trainer check --manifest ./my-trainer/manifest.json --entrypoint my-trainer --preview`,
    output: `{
  "schema": "yoao-extension-manifest/v1",
  "protocol": "yoao-trainer/v1",
  "checks": ["describe", "validate-config", "train", "sigterm-130", "preview"],
  "passed": true
}`,
    docLabel: "查看 Plugin-SDK",
    docHref: plug("sdk/"),
  },
  {
    id: "agent-streams",
    label: "Agent & Streams",
    language: "bash",
    summary: "离线能力发现、Schema 展开与 6 条类型化事件流",
    command: `yoao capabilities --status covered --limit 20 --json
yoao describe training_runs.create --json
yoao streams batch-events "$PROJECT_ID" --max-events 20 --timeout 30`,
    output: `{
  "catalog_mode": "offline",
  "operation": "training_runs.create",
  "requires": ["preflight_digest", "dataset_id"],
  "event_streams": 6,
  "event": { "type": "batch.status_changed", "to": "in_review" }
}`,
    docLabel: "查看 Agent 接入指南",
    docHref: u("/sdk/agents"),
  },
];

const apiHref = u("/api/");
const activeExtensionId = ref<ExtensionPointId>(extensionPoints[0].id);
const activeSnippetId = ref<DevSnippetTabId>(devSnippets[0].id);
const copied = ref(false);
let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

const activeExtension = computed<ExtensionPointSpec>(
  () => extensionPoints.find((e) => e.id === activeExtensionId.value) ?? extensionPoints[0],
);
const activeSnippet = computed<DevSnippetSpec>(
  () => devSnippets.find((s) => s.id === activeSnippetId.value) ?? devSnippets[0],
);

async function copyActiveSnippet(): Promise<void> {
  if (!navigator.clipboard?.writeText) return;
  try {
    await navigator.clipboard.writeText(activeSnippet.value.command);
    copied.value = true;
    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch {
    copied.value = false;
  }
}

watch(activeSnippetId, () => {
  copied.value = false;
  if (copyResetTimer) {
    clearTimeout(copyResetTimer);
    copyResetTimer = undefined;
  }
});

onBeforeUnmount(() => {
  if (copyResetTimer) clearTimeout(copyResetTimer);
});
</script>

<template>
  <FrameSection :id="HOME_SECTIONS.ecosystem.id" corners="both">
    <div data-plugin-ecosystem class="scroll-mt-16">
      <div class="pe-head">
        <div>
          <span class="pe-kicker">{{ HOME_SECTIONS.ecosystem.kicker }}</span>
          <h2 class="pe-title">五类插件扩展，与面向脚本和 Agent 的开放接口</h2>
        </div>
        <p class="pe-lead">
          YOAO 基于 <code class="pe-code">yoao-extension-manifest/v1</code>
          分离核心平台、官方插件与 Plugin-SDK 三仓库，并配套
          <code class="pe-code">yoao-sdk</code> 支撑 Python、CLI、TUI 与 AI Agent 自动化。
        </p>
      </div>

      <div class="pe-card mt-7">
        <div class="pe-bar">
          <span class="pe-bar-title">
            <Puzzle class="size-3.5 text-ai" aria-hidden="true" />
            <span>
              EXTENSION POINTS · {{ HOME_STATS.extensionPoints }} 扩展点 ·
              {{ HOME_STATS.officialPlugins.total }} 官方插件
            </span>
          </span>
          <span class="pe-tag">yoao-extension-manifest/v1</span>
        </div>

        <TabsRoot v-model="activeExtensionId" class="p-4">
          <TabsList class="pe-tablist" aria-label="YOAO 插件扩展点">
            <TabsTrigger
              v-for="ext in extensionPoints"
              :key="ext.id"
              :value="ext.id"
              :data-extension-tab="ext.id"
              class="pe-tab"
              :class="activeExtensionId === ext.id ? 'pe-tab-ai' : 'pe-tab-idle'"
            >
              <span>{{ ext.label }}</span>
              <span class="pe-count" :class="activeExtensionId === ext.id && 'pe-count-ai'">
                {{ ext.officialCount || "SDK" }}
              </span>
            </TabsTrigger>
          </TabsList>

          <Motion
            :key="activeExtension.id"
            as="div"
            :initial="panelMotion.initial"
            :animate="panelMotion.animate"
            :transition="panelMotion.transition"
            data-extension-panel
            class="pe-panel"
          >
            <div class="pe-panel-head">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span data-extension-protocol class="pe-pill">{{ activeExtension.protocol }}</span>
                  <span class="pe-mono text-fg-subtle">{{ activeExtension.id }}</span>
                  <span class="pe-mono text-fg-muted">
                    {{ activeExtension.officialCount ? `${activeExtension.officialCount} 个官方插件` : "团队声明式扩展" }}
                  </span>
                </div>
                <p class="mt-2 mb-0 text-[13.5px] leading-relaxed text-fg-muted">
                  {{ activeExtension.description }}
                </p>
                <p data-extension-runtime class="mt-1 mb-0 break-words font-mono text-[11.5px] text-fg-subtle">
                  运行边界：{{ activeExtension.runtime }}
                </p>
              </div>

              <div class="pe-links">
                <a :href="activeExtension.protocolHref" class="pe-link text-accent">
                  <span>协议规范</span>
                  <ArrowUpRight class="pe-arrow" aria-hidden="true" />
                </a>
                <a :href="activeExtension.manageHref" class="pe-link text-fg-muted">
                  <span>{{ activeExtension.id === "theme" ? "使用 @yoao/plugin-sdk 校验" : "安装与治理指南" }}</span>
                  <ArrowUpRight class="pe-arrow" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div v-if="activeExtension.plugins.length" data-extension-plugins class="pe-plugins">
              <a
                v-for="plugin in activeExtension.plugins"
                :key="plugin.id"
                :href="plugin.href"
                data-extension-plugin
                class="pe-plugin"
              >
                <span class="min-w-0">
                  <strong class="block text-[13px] font-semibold text-fg">{{ plugin.name }}</strong>
                  <span class="mt-0.5 block text-[12px] leading-snug text-fg-muted">{{ plugin.summary }}</span>
                </span>
                <ArrowUpRight class="pe-arrow mt-0.5 text-fg-subtle" aria-hidden="true" />
              </a>
            </div>

            <div v-else data-extension-plugins class="pe-empty">
              <p class="m-0 leading-relaxed">
                当前无内置官方主题包；团队可通过 <code class="pe-code">@yoao/plugin-sdk</code>
                编写并离线校验自定义 <code class="pe-code">--sc-*</code> 声明式主题变量包。
              </p>
              <a :href="activeExtension.manageHref" class="pe-link shrink-0 text-accent">
                <span>查看 JS/TS SDK</span>
                <ArrowUpRight class="pe-arrow" aria-hidden="true" />
              </a>
            </div>
          </Motion>
        </TabsRoot>

        <div data-repo-boundary class="pe-repos">
          <a v-for="repo in repoBoundaries" :key="repo.name" :href="repo.href" class="pe-repo">
            <span class="flex items-center justify-between gap-2">
              <strong class="font-mono text-[12.5px] font-semibold text-fg">{{ repo.name }}</strong>
              <span class="inline-flex items-center gap-1 font-mono text-[10.5px] text-fg-subtle">
                <span>{{ repo.role }}</span>
                <ArrowUpRight class="pe-arrow size-3" aria-hidden="true" />
              </span>
            </span>
            <span class="text-[12.5px] leading-snug text-fg-muted">{{ repo.summary }}</span>
          </a>
        </div>
      </div>

      <div class="pe-card mt-5">
        <div class="pe-bar">
          <span class="pe-bar-title">
            <Terminal class="size-3.5 text-accent" aria-hidden="true" />
            <span>
              DEVELOPER & AGENT INTERFACE · {{ HOME_STATS.apiRoutes }} V1 ROUTES · 6 STREAMS
            </span>
          </span>
          <a :href="apiHref" class="pe-link font-mono text-[11px] text-accent">
            <span>OpenAPI 参考</span>
            <ArrowUpRight class="pe-arrow size-3" aria-hidden="true" />
          </a>
        </div>

        <TabsRoot v-model="activeSnippetId" class="p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <TabsList class="pe-tablist" aria-label="开发者与 Agent 接口示例">
              <TabsTrigger
                v-for="snippet in devSnippets"
                :key="snippet.id"
                :value="snippet.id"
                :data-snippet-tab="snippet.id"
                class="pe-tab font-mono text-[12px]"
                :class="activeSnippetId === snippet.id ? 'pe-tab-accent' : 'pe-tab-idle'"
              >
                {{ snippet.label }}
              </TabsTrigger>
            </TabsList>

            <button
              type="button"
              data-copy-snippet
              class="pe-copy"
              :class="copied && 'pe-copy-ok'"
              @click="copyActiveSnippet"
            >
              <Check v-if="copied" class="size-3.5" aria-hidden="true" />
              <Copy v-else class="size-3.5" aria-hidden="true" />
              <span>{{ copied ? "已复制" : "复制命令" }}</span>
            </button>
          </div>

          <div class="pe-panes">
            <div class="pe-pane bg-bg-subtle">
              <div class="pe-pane-head">
                <span class="pe-mono text-accent uppercase">{{ activeSnippet.language }}</span>
                <span class="truncate text-[12px] text-fg-muted">{{ activeSnippet.summary }}</span>
              </div>
              <pre data-snippet-command class="pe-pre text-[12px] text-fg"><code>{{ activeSnippet.command }}</code></pre>
            </div>

            <div class="pe-pane bg-surface-alt/60">
              <div class="pe-pane-head">
                <span class="pe-tag">VERIFIED OUTPUT</span>
                <span class="pe-mono text-fg-subtle">{{ activeSnippet.id }}</span>
              </div>
              <pre data-snippet-output class="pe-pre text-[11.5px] text-fg-muted"><code>{{ activeSnippet.output }}</code></pre>
            </div>
          </div>

          <div class="pe-foot">
            <span class="pe-tag">YOAO-SDK · PLUGIN-SDK · STRUCTURED JSON &amp; BOUNDED STREAMS</span>
            <a data-snippet-doc-link :href="activeSnippet.docHref" class="pe-link text-[13px] text-accent">
              <span>{{ activeSnippet.docLabel }}</span>
              <ArrowUpRight class="pe-arrow" aria-hidden="true" />
            </a>
          </div>
        </TabsRoot>
      </div>
    </div>
  </FrameSection>
</template>

<style>
[data-plugin-ecosystem] .pe-head {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}
[data-plugin-ecosystem] .pe-kicker,
[data-plugin-ecosystem] .pe-tag,
[data-plugin-ecosystem] .pe-mono {
  font-family: var(--docs-font-mono);
  font-size: 11px;
}
[data-plugin-ecosystem] .pe-kicker {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--yoao-fg-subtle);
}
[data-plugin-ecosystem] .pe-tag {
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--yoao-fg-subtle);
}
[data-plugin-ecosystem] .pe-title {
  margin: 10px 0 0;
  font-size: clamp(26px, 3.3vw, 36px);
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: -0.03em;
  color: var(--yoao-fg);
  text-wrap: balance;
}
[data-plugin-ecosystem] .pe-lead {
  margin: 0;
  max-width: 500px;
  font-size: 14.5px;
  line-height: 1.62;
  color: var(--yoao-fg-muted);
}
[data-plugin-ecosystem] .pe-code {
  font-family: var(--docs-font-mono);
  font-size: 12.5px;
  color: var(--yoao-fg);
}
[data-plugin-ecosystem] .pe-card {
  overflow: hidden;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius-lg);
  background: var(--yoao-surface);
  box-shadow: var(--yoao-shadow-md);
}
[data-plugin-ecosystem] .pe-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--yoao-divider);
  background: var(--yoao-surface-alt);
  padding: 10px 16px;
}
[data-plugin-ecosystem] .pe-bar-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--docs-font-mono);
  font-size: 11px;
  color: var(--yoao-fg-muted);
}
[data-plugin-ecosystem] .pe-tablist {
  display: flex;
  min-width: 0;
  max-width: 100%;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}
[data-plugin-ecosystem] .pe-tab {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius-sm);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  outline: none;
  transition: color 0.15s, border-color 0.15s, background-color 0.15s;
}
[data-plugin-ecosystem] .pe-tab:focus-visible,
[data-plugin-ecosystem] .pe-copy:focus-visible {
  box-shadow: 0 0 0 2px var(--yoao-accent-border);
}
[data-plugin-ecosystem] .pe-tab-idle {
  background: var(--yoao-surface);
  color: var(--yoao-fg-muted);
}
[data-plugin-ecosystem] .pe-tab-idle:hover {
  border-color: var(--yoao-border-strong);
  color: var(--yoao-fg);
}
[data-plugin-ecosystem] .pe-tab-ai {
  border-color: var(--yoao-ai-border);
  background: var(--yoao-ai-soft);
  color: var(--yoao-ai);
}
[data-plugin-ecosystem] .pe-tab-accent {
  border-color: var(--yoao-accent-border);
  background: var(--yoao-accent-soft);
  color: var(--yoao-accent);
}
[data-plugin-ecosystem] .pe-count {
  border-radius: 9999px;
  background: var(--yoao-surface-alt);
  padding: 1px 6px;
  font-family: var(--docs-font-mono);
  font-size: 10px;
  color: var(--yoao-fg-subtle);
}
[data-plugin-ecosystem] .pe-count-ai {
  background: var(--yoao-surface);
  color: var(--yoao-ai);
}
[data-plugin-ecosystem] .pe-panel {
  margin-top: 14px;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius);
  background: var(--yoao-bg-subtle);
  padding: 14px;
}
[data-plugin-ecosystem] .pe-panel-head {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--yoao-divider);
  padding-bottom: 12px;
}
[data-plugin-ecosystem] .pe-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--yoao-ai-border);
  border-radius: 9999px;
  background: var(--yoao-ai-soft);
  padding: 2px 10px;
  font-family: var(--docs-font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--yoao-ai);
}
[data-plugin-ecosystem] .pe-links {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 12.5px;
}
[data-plugin-ecosystem] .pe-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s;
}
[data-plugin-ecosystem] .pe-link:hover {
  color: var(--yoao-accent-hover);
}
[data-plugin-ecosystem] .pe-arrow {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: transform 0.15s, color 0.15s;
}
[data-plugin-ecosystem] .pe-link:hover .pe-arrow,
[data-plugin-ecosystem] .pe-plugin:hover .pe-arrow,
[data-plugin-ecosystem] .pe-repo:hover .pe-arrow {
  transform: translate(2px, -2px);
  color: var(--yoao-accent);
}
[data-plugin-ecosystem] .pe-plugins {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}
[data-plugin-ecosystem] .pe-plugin {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius-sm);
  background: var(--yoao-surface);
  padding: 10px 12px;
  text-decoration: none;
  transition: border-color 0.15s, background-color 0.15s;
}
[data-plugin-ecosystem] .pe-plugin:hover {
  border-color: var(--yoao-border-strong);
  background: var(--yoao-surface-alt);
}
[data-plugin-ecosystem] .pe-empty {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px dashed var(--yoao-border-strong);
  border-radius: var(--yoao-radius-sm);
  background: var(--yoao-surface);
  padding: 12px 14px;
  font-size: 13px;
  color: var(--yoao-fg-muted);
}
[data-plugin-ecosystem] .pe-repos {
  display: grid;
  border-top: 1px solid var(--yoao-divider);
  background: var(--yoao-surface-alt);
}
[data-plugin-ecosystem] .pe-repo {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid var(--yoao-divider);
  padding: 12px 16px;
  text-decoration: none;
  transition: background-color 0.15s;
}
[data-plugin-ecosystem] .pe-repo:first-child {
  border-top: 0;
}
[data-plugin-ecosystem] .pe-repo:hover {
  background: var(--yoao-surface-hover);
}
[data-plugin-ecosystem] .pe-copy {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius-sm);
  background: var(--yoao-surface-alt);
  padding: 6px 10px;
  font-family: var(--docs-font-mono);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yoao-fg-muted);
  outline: none;
  transition: color 0.15s, border-color 0.15s, background-color 0.15s;
}
[data-plugin-ecosystem] .pe-copy:hover {
  border-color: var(--yoao-border-strong);
  color: var(--yoao-fg);
}
[data-plugin-ecosystem] .pe-copy-ok {
  border-color: var(--yoao-positive-border);
  background: var(--yoao-positive-soft);
  color: var(--yoao-positive);
}
[data-plugin-ecosystem] .pe-panes {
  margin-top: 14px;
  display: grid;
  min-width: 0;
  gap: 12px;
}
[data-plugin-ecosystem] .pe-pane {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius);
}
[data-plugin-ecosystem] .pe-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--yoao-divider);
  background: var(--yoao-surface-alt);
  padding: 7px 14px;
}
[data-plugin-ecosystem] .pe-pre {
  margin: 0;
  max-width: 100%;
  overflow-x: auto;
  padding: 12px 14px;
  font-family: var(--docs-font-mono);
  line-height: 1.65;
}
[data-plugin-ecosystem] .pe-foot {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--yoao-divider);
  padding-top: 10px;
}
@media (min-width: 640px) {
  [data-plugin-ecosystem] .pe-plugins {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 768px) {
  [data-plugin-ecosystem] .pe-repos {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  [data-plugin-ecosystem] .pe-repo {
    border-top: 0;
    border-left: 1px solid var(--yoao-divider);
  }
  [data-plugin-ecosystem] .pe-repo:first-child {
    border-left: 0;
  }
}
@media (min-width: 1024px) {
  [data-plugin-ecosystem] .pe-head {
    flex-direction: row;
    align-items: flex-end;
  }
  [data-plugin-ecosystem] .pe-panel-head {
    flex-direction: row;
    align-items: flex-start;
  }
  [data-plugin-ecosystem] .pe-plugins {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  [data-plugin-ecosystem] .pe-panes {
    grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-plugin-ecosystem] .pe-tab,
  [data-plugin-ecosystem] .pe-link,
  [data-plugin-ecosystem] .pe-arrow,
  [data-plugin-ecosystem] .pe-plugin,
  [data-plugin-ecosystem] .pe-repo,
  [data-plugin-ecosystem] .pe-copy {
    transition: none;
  }
}
</style>
