<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import { AnimatePresence, Motion } from "motion-v";
import { ArrowUpRight, RotateCcw } from "lucide-vue-next";
import FrameSection from "./FrameSection.vue";
import { HOME_SECTIONS, type LoopStage, type LoopStageTone } from "./home-contract";

const stages: readonly LoopStage[] = [
  {
    no: "01",
    title: "接入与零拷贝治理",
    desc: "托管上传、外部 S3/SFTP/受控目录原地引用与跨网络只读站点 Agent，按 SHA-256 核验内容身份与重复检测。",
    status: "DATA",
    tone: "neutral",
    source: "托管存储 / S3·SFTP·受控目录 / 站点 Agent",
    format: "Image · Video · LiDAR + Camera",
    audit: "SHA-256 核验与图片重复检测",
    evidenceBadges: ["Managed", "Zero-Copy Reference", "Site Agent", "SHA-256"],
    href: withBase("/user-guide/datasets/"),
    ctaLabel: "查看数据集与存储指南",
  },
  {
    no: "02",
    title: "AI 预标候选",
    desc: "SAM3、Grounded-SAM2、YOLO 与 RapidOCR 推理插件执行单题或多阶段批量预标，候选结果与正式标注严格隔离。",
    status: "PRE-LABELED",
    tone: "ai",
    source: "SAM3 · Grounded-SAM2 · YOLO · RapidOCR",
    format: "Prediction 候选（独立审阅）",
    audit: "保留模型版本、变体与阈值快照",
    evidenceBadges: ["Prediction != Annotation", "多阶段编排", "版本与参数快照"],
    href: withBase("/user-guide/ai/"),
    ctaLabel: "查看 AI 辅助指南",
  },
  {
    no: "03",
    title: "多模态人工精修",
    desc: "在统一工作台完成图像 Bbox、OBB、Mask、超大图金字塔、视频关键帧传播与 3D 点云多相机联合精修。",
    status: "REFINED",
    tone: "accent",
    source: "统一多模态工作台 · 正负种子传播",
    format: "Annotation 正式对象与跨帧轨迹",
    audit: "保留历史操作栈与关键帧来源",
    evidenceBadges: ["图像 · 视频 · 3D", "超大图金字塔", "正负种子传播"],
    href: withBase("/user-guide/workbench/"),
    ctaLabel: "查看工作台指南",
  },
  {
    no: "04",
    title: "质量审核与协同",
    desc: "角色职责分离、贡献者证据防控自审、四类结构化退回标准，以及跨图像、视频和点云的画布图钉评论与 @ 提及。",
    status: "APPROVED",
    tone: "positive",
    source: "Review Queue · 批次锁与自审拦截",
    format: "Verified Annotation & Review Diff",
    audit: "记录审核员、四类退回原因与讨论线程",
    evidenceBadges: ["自审拒绝", "四类结构化退回", "画布图钉与 @提及"],
    href: withBase("/user-guide/review/"),
    ctaLabel: "查看审核流程",
  },
  {
    no: "05",
    title: "冻结版本与在线训练",
    desc: "从筛选结果冻结不可变训练数据版本并记录 input_membership 回执，由 yoao-trainer/v1 断网容器插件执行训练、逐样本评估与主动学习选样。",
    status: "TRAINED",
    tone: "caution",
    source: "不可变数据快照 · yoao-trainer/v1 监督器",
    format: "Ultralytics / LibreYOLO 权重与评估报告",
    audit: "input_membership 回执与受控 GPU 槽位",
    evidenceBadges: ["不可变数据快照", "yoao-trainer/v1", "逐样本评估", "主动学习选样"],
    href: withBase("/user-guide/online-learning/"),
    ctaLabel: "查看在线学习指南",
  },
  {
    no: "06",
    title: "模型回流与开放导出",
    desc: "通过资格核验的模型发布为项目默认预标模型回流至阶段 02，同时支持 COCO、YOLO、MOT、KITTI、NuScenes 与 Native JSON 2.0 导出。",
    status: "DEPLOYED",
    tone: "info",
    source: "模型回流发布 · 异步导出作业",
    format: "COCO · YOLO · MOT · KITTI · NuScenes · Native JSON 2.0",
    audit: "资格门禁校验与角色导出权限边界",
    evidenceBadges: ["回流至 02 默认预标", "COCO · YOLO · MOT", "KITTI · NuScenes · Native JSON 2.0"],
    href: withBase("/user-guide/online-learning/models"),
    ctaLabel: "查看模型回流与导出",
    returnsToStage: "02",
  },
];

const BADGE_CLASSES: Record<LoopStageTone, string> = {
  neutral: "border-border bg-surface-alt text-fg-muted",
  ai: "border-ai-border bg-ai-soft text-ai",
  accent: "border-accent-border bg-accent-soft text-accent",
  positive: "border-positive-border bg-positive-soft text-positive",
  caution: "border-caution-border bg-caution-soft text-caution",
  info: "border-info-border bg-info-soft text-info",
};

const DEFAULT_RAIL_HEIGHT = 600;
const DEFAULT_DOT_YS: readonly number[] = [28, 128, 228, 328, 428, 528];

const activeIndex = ref(0);
const sectionRef = ref<HTMLElement | null>(null);
const stageListRef = ref<HTMLElement | null>(null);
const timelineDrawn = ref(false);
const railHeight = ref(DEFAULT_RAIL_HEIGHT);
const dotYs = ref<readonly number[]>(DEFAULT_DOT_YS);
let io: IntersectionObserver | undefined;
let ro: ResizeObserver | undefined;

const activeStage = computed(() => stages[activeIndex.value]);
const badgeClasses = computed(() => BADGE_CLASSES[activeStage.value.tone]);
const isReturnLoopActive = computed(() => Boolean(activeStage.value.returnsToStage));
const railStartY = computed(() => dotYs.value[0] ?? DEFAULT_DOT_YS[0]);
const railEndY = computed(() => dotYs.value[stages.length - 1] ?? DEFAULT_DOT_YS[stages.length - 1]);
const activeRailEndY = computed(() => dotYs.value[activeIndex.value] ?? railStartY.value);
const railTotalLength = computed(() => Math.max(1, Math.ceil(railEndY.value - railStartY.value + 16)));
const returnSourceIndex = stages.findIndex((stage) => Boolean(stage.returnsToStage));
const returnTargetIndex =
  returnSourceIndex >= 0
    ? stages.findIndex((stage) => stage.no === stages[returnSourceIndex].returnsToStage)
    : -1;
const returnStartY = computed(
  () => dotYs.value[returnSourceIndex] ?? DEFAULT_DOT_YS[returnSourceIndex] ?? railEndY.value,
);
const returnEndY = computed(
  () => dotYs.value[returnTargetIndex] ?? DEFAULT_DOT_YS[returnTargetIndex] ?? railStartY.value,
);
const returnPathD = computed(() => {
  const y0 = returnStartY.value;
  const y1 = returnEndY.value;
  return `M 23 ${y0} L 13 ${y0} Q 7 ${y0} 7 ${y0 - 6} L 7 ${y1 + 6} Q 7 ${y1} 13 ${y1} L 21 ${y1}`;
});
const returnArrowD = computed(() => {
  const y1 = returnEndY.value;
  return `M 16.5 ${y1 - 4.5} L 21.5 ${y1} L 16.5 ${y1 + 4.5}`;
});
const stageCountLabel = String(stages.length).padStart(2, "0");

function measureRailGeometry(): void {
  const listEl = stageListRef.value;
  if (!listEl) return;
  const listRect = listEl.getBoundingClientRect();
  if (listRect.height <= 0) return;
  const dots = listEl.querySelectorAll<HTMLElement>("[data-loop-dot]");
  if (dots.length !== stages.length) return;
  const measured: number[] = [];
  for (const dot of dots) {
    const r = dot.getBoundingClientRect();
    measured.push(Math.round((r.top - listRect.top + r.height / 2) * 10) / 10);
  }
  railHeight.value = Math.round(listRect.height);
  dotYs.value = measured;
}

function selectStage(index: number): void {
  if (index >= 0 && index < stages.length) {
    activeIndex.value = index;
  }
}

function jumpToStage(stageNo: string): void {
  const targetIndex = stages.findIndex((stage) => stage.no === stageNo);
  if (targetIndex >= 0) {
    activeIndex.value = targetIndex;
  }
}

onMounted(() => {
  measureRailGeometry();
  if ("ResizeObserver" in window && stageListRef.value) {
    ro = new ResizeObserver(() => measureRailGeometry());
    ro.observe(stageListRef.value);
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    timelineDrawn.value = true;
    return;
  }
  io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        timelineDrawn.value = true;
        io?.disconnect();
      }
    },
    { threshold: 0.2 },
  );
  if (sectionRef.value) io.observe(sectionRef.value);
});

onBeforeUnmount(() => {
  io?.disconnect();
  ro?.disconnect();
});
</script>

<template>
  <FrameSection :id="HOME_SECTIONS.flow.id" corners="both">
    <div ref="sectionRef" class="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-10">
      <div>
        <span class="font-mono text-[11px] tracking-[0.12em] text-fg-subtle uppercase">
          {{ HOME_SECTIONS.flow.kicker }}
        </span>
        <h2
          class="mt-2.5 text-balance text-[clamp(26px,3.2vw,36px)] font-semibold leading-[1.18] tracking-[-0.03em] text-fg"
        >
          从零拷贝接入，到训练回流闭环
        </h2>
        <p class="mt-2.5 max-w-[540px] text-[14.5px] leading-[1.6] text-fg-muted">
          标注不是终点。审核通过的真值冻结为不可变训练版本，经受控训练器插件迭代与评估后，回流成为下一轮默认预标模型。
        </p>

        <div class="relative mt-6 pl-10">
          <svg
            class="pointer-events-none absolute inset-y-0 left-0 h-full w-10 overflow-visible"
            :viewBox="`0 0 40 ${railHeight}`"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              x1="28"
              :y1="railStartY"
              x2="28"
              :y2="railEndY"
              stroke="var(--yoao-rail)"
              stroke-width="1.5"
              vector-effect="non-scaling-stroke"
            />
            <line
              x1="28"
              :y1="railStartY"
              x2="28"
              :y2="activeRailEndY"
              stroke="var(--yoao-ai-solid)"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
              class="timeline-draw-line"
              :class="{ 'is-drawn': timelineDrawn }"
              :style="{ '--rail-length': String(railTotalLength) }"
            />
            <line
              x1="28"
              :y1="railStartY"
              x2="28"
              :y2="activeRailEndY"
              stroke="var(--yoao-ai-solid)"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
              class="yoao-dash-flow"
              opacity="0.5"
            />

            <path
              data-loop-return-arc
              :data-active="isReturnLoopActive ? 'true' : 'false'"
              :d="returnPathD"
              fill="none"
              :stroke="isReturnLoopActive ? 'var(--yoao-ai-solid)' : 'var(--yoao-rail-strong)'"
              :stroke-width="isReturnLoopActive ? '1.75' : '1.25'"
              :stroke-dasharray="isReturnLoopActive ? undefined : '3 4'"
              :opacity="isReturnLoopActive ? '0.42' : '0.7'"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
              class="loop-return-path"
            />
            <path
              v-if="isReturnLoopActive"
              data-loop-return-flow
              :d="returnPathD"
              fill="none"
              stroke="var(--yoao-ai-solid)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
              class="yoao-dash-flow"
            />
            <path
              data-loop-return-arrow
              :d="returnArrowD"
              fill="none"
              :stroke="isReturnLoopActive ? 'var(--yoao-ai-solid)' : 'var(--yoao-rail-strong)'"
              :stroke-width="isReturnLoopActive ? '1.75' : '1.25'"
              :opacity="isReturnLoopActive ? '1' : '0.75'"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
              class="loop-return-path"
            />
          </svg>

          <div ref="stageListRef" class="flex flex-col divide-y divide-rail border-y border-rail">
            <button
              v-for="(stage, index) in stages"
              :key="stage.no"
              type="button"
              :data-loop-stage="stage.no"
              class="group relative flex items-start gap-3 py-3 pr-3 pl-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-inset"
              :class="activeIndex === index ? 'bg-surface-alt/85' : 'hover:bg-surface-alt/40'"
              :aria-pressed="activeIndex === index"
              @click="selectStage(index)"
              @mouseenter="selectStage(index)"
              @focus="selectStage(index)"
            >
              <span
                data-loop-dot
                class="absolute top-[19px] -left-[17px] size-2.5 rounded-full border transition-all"
                :class="[
                  index <= activeIndex
                    ? 'border-ai-solid bg-ai-solid'
                    : 'border-border-strong bg-bg',
                  isReturnLoopActive && stage.no === activeStage.returnsToStage
                    ? 'ring-4 ring-ai-soft'
                    : '',
                ]"
                aria-hidden="true"
              ></span>

              <span class="pt-0.5 font-mono text-[11px] text-fg-subtle">{{ stage.no }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <strong class="text-[15px] font-semibold tracking-[-0.015em] text-fg">
                    {{ stage.title }}
                  </strong>
                  <div class="flex shrink-0 items-center gap-1.5">
                    <span
                      v-if="stage.returnsToStage"
                      class="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9.5px] transition-colors"
                      :class="
                        isReturnLoopActive
                          ? 'border-ai-border bg-ai-soft text-ai'
                          : 'border-border bg-surface text-fg-subtle'
                      "
                    >
                      <RotateCcw class="size-2.5" aria-hidden="true" />
                      <span>{{ stage.returnsToStage }}</span>
                    </span>
                    <span class="font-mono text-[10px] text-fg-subtle">{{ stage.status }}</span>
                  </div>
                </div>
                <p class="mt-0.5 mb-0 text-[13px] leading-[1.52] text-fg-muted">
                  {{ stage.desc }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="lg:sticky lg:top-24">
        <div
          data-loop-inspector
          class="overflow-hidden rounded-[var(--yoao-radius-lg)] border border-border bg-surface shadow-[var(--yoao-shadow-md)]"
        >
          <div
            class="flex items-center justify-between border-b border-divider bg-surface-alt px-4 py-2.5"
          >
            <span class="font-mono text-[11px] text-fg-muted">
              LOOP · STAGE {{ activeStage.no }} / {{ stageCountLabel }}
            </span>
            <span
              data-inspector-status
              class="inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em]"
              :class="badgeClasses"
            >
              {{ activeStage.status }}
            </span>
          </div>

          <div class="p-4 sm:p-5" style="background-image: var(--yoao-signature-gradient)">
            <AnimatePresence mode="wait">
              <Motion
                :key="activeStage.no"
                :initial="{ opacity: 0, y: 6, filter: 'blur(4px)' }"
                :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
                :exit="{ opacity: 0, y: -6, filter: 'blur(2px)' }"
                :transition="{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }"
                class="rounded-[var(--yoao-radius)] border border-border bg-surface p-4 shadow-[var(--yoao-shadow-sm)]"
              >
                <div class="flex items-center justify-between gap-3 border-b border-divider pb-3">
                  <div>
                    <div class="font-mono text-[10px] tracking-[0.08em] text-fg-subtle uppercase">
                      Stage {{ activeStage.no }} / {{ stageCountLabel }}
                    </div>
                    <h3
                      data-inspector-title
                      class="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-fg"
                    >
                      {{ activeStage.title }}
                    </h3>
                  </div>
                  <span
                    class="shrink-0 rounded-[var(--yoao-radius-sm)] border px-2 py-0.5 font-mono text-[10.5px]"
                    :class="badgeClasses"
                  >
                    {{ activeStage.status }}
                  </span>
                </div>

                <dl class="mt-3.5 grid gap-2.5 text-[13px]">
                  <div class="flex items-baseline justify-between gap-4">
                    <dt class="shrink-0 font-mono text-[11px] text-fg-subtle">来源</dt>
                    <dd data-inspector-source class="m-0 text-right font-medium text-fg">
                      {{ activeStage.source }}
                    </dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4">
                    <dt class="shrink-0 font-mono text-[11px] text-fg-subtle">产物</dt>
                    <dd
                      data-inspector-format
                      class="m-0 text-right font-mono text-[12px] text-balance text-fg-muted"
                    >
                      {{ activeStage.format }}
                    </dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4">
                    <dt class="shrink-0 font-mono text-[11px] text-fg-subtle">审计</dt>
                    <dd data-inspector-audit class="m-0 text-right text-fg-muted">
                      {{ activeStage.audit }}
                    </dd>
                  </div>
                </dl>
              </Motion>
            </AnimatePresence>

            <div class="mt-3.5 rounded-[var(--yoao-radius)] border border-divider bg-surface p-3.5">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-[10px] tracking-[0.08em] text-fg-subtle uppercase">
                  核验证据与能力边界
                </span>
                <span class="font-mono text-[10px] text-fg-subtle">
                  {{ activeStage.evidenceBadges.length }} ITEMS
                </span>
              </div>

              <div class="mt-2.5 flex flex-wrap gap-1.5">
                <span
                  v-for="badge in activeStage.evidenceBadges"
                  :key="badge"
                  data-inspector-evidence
                  class="inline-flex items-center rounded-[var(--yoao-radius-sm)] border border-border bg-surface-alt px-2 py-0.5 font-mono text-[11px] text-fg-muted"
                >
                  {{ badge }}
                </span>
              </div>

              <div v-if="activeStage.returnsToStage" class="mt-3 flex items-center">
                <button
                  type="button"
                  data-loop-return-trigger
                  class="inline-flex items-center gap-1.5 rounded-full border border-ai-border bg-ai-soft px-3 py-1 font-mono text-[11.5px] font-medium text-ai transition-colors hover:border-ai-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  @click="jumpToStage(activeStage.returnsToStage)"
                >
                  <RotateCcw class="size-3.5 shrink-0" aria-hidden="true" />
                  <span>回流至阶段 {{ activeStage.returnsToStage }} 预标</span>
                </button>
              </div>

              <div class="mt-3.5 flex items-center justify-between gap-3 border-t border-divider pt-3">
                <span class="font-mono text-[10.5px] text-fg-subtle uppercase">
                  {{
                    activeStage.returnsToStage
                      ? `CLOSED LOOP · ${activeStage.no} → ${activeStage.returnsToStage}`
                      : `STAGE ${activeStage.no} GUIDE`
                  }}
                </span>
                <a
                  data-inspector-guide-link
                  :href="activeStage.href"
                  class="group inline-flex items-center gap-1.5 text-[13px] font-medium text-accent no-underline transition-colors hover:text-accent-hover"
                >
                  <span>{{ activeStage.ctaLabel }}</span>
                  <ArrowUpRight
                    class="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FrameSection>
</template>

<style scoped>
.timeline-draw-line {
  stroke-dasharray: var(--rail-length, 540);
  stroke-dashoffset: var(--rail-length, 540);
  transition:
    stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    y2 0.3s ease;
}

.timeline-draw-line.is-drawn {
  stroke-dashoffset: 0;
}

.loop-return-path {
  transition:
    stroke 0.2s ease,
    opacity 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  .timeline-draw-line {
    stroke-dashoffset: 0;
    transition: none;
  }

  .loop-return-path {
    transition: none;
  }
}
</style>
