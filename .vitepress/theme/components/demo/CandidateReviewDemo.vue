<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Check, Pause, Play, RotateCcw, SkipForward, Sparkle, X } from "lucide-vue-next";
import DemoCursor from "./DemoCursor.vue";
import DemoFrame from "./DemoFrame.vue";
import DemoSkeleton from "./DemoSkeleton.vue";

type CandidateStatus = "pending" | "accepted" | "rejected";

interface CandidateItem {
  id: string;
  label: string;
  confidence: string;
  rect: { x: number; y: number; w: number; h: number };
  status: CandidateStatus;
}

const INITIAL_CANDIDATES: CandidateItem[] = [
  {
    id: "cand-1",
    label: "car",
    confidence: "0.96",
    rect: { x: 46, y: 88, w: 108, h: 68 },
    status: "pending",
  },
  {
    id: "cand-2",
    label: "truck",
    confidence: "0.92",
    rect: { x: 186, y: 66, w: 132, h: 86 },
    status: "pending",
  },
  {
    id: "cand-3",
    label: "cyclist",
    confidence: "0.89",
    rect: { x: 356, y: 104, w: 68, h: 62 },
    status: "pending",
  },
];

const items = ref<CandidateItem[]>(INITIAL_CANDIDATES.map((c) => ({ ...c, rect: { ...c.rect } })));
const focusedId = ref<string>("cand-1");
const autoAdvance = ref(true);
const playing = ref(false);
const lastActionHint = ref("按 Tab 切换待审候选，按 A 接受或 D 拒绝。");
const cursorTarget = ref<"tab" | "accept" | "reject">("accept");

const stageRef = ref<HTMLElement>();
const tabBtnRef = ref<HTMLButtonElement>();
const acceptBtnRef = ref<HTMLButtonElement>();
const rejectBtnRef = ref<HTMLButtonElement>();
const cursorPos = ref({ x: 240, y: 120 });
const cursorClicking = ref(false);

let timer: ReturnType<typeof setInterval> | undefined;
let clickPulseTimer: ReturnType<typeof setTimeout> | undefined;
let autoStepIndex = 0;

const pendingItems = computed(() => items.value.filter((i) => i.status === "pending"));
const acceptedCount = computed(() => items.value.filter((i) => i.status === "accepted").length);
const rejectedCount = computed(() => items.value.filter((i) => i.status === "rejected").length);
const focusedItem = computed(
  () => items.value.find((i) => i.id === focusedId.value) ?? pendingItems.value[0] ?? items.value[0],
);

function syncCursorTo(kind: "tab" | "accept" | "reject"): void {
  cursorTarget.value = kind;
  const stage = stageRef.value;
  const target =
    kind === "accept" ? acceptBtnRef.value : kind === "reject" ? rejectBtnRef.value : tabBtnRef.value;
  if (!stage || !target) return;
  const sr = stage.getBoundingClientRect();
  const tr = target.getBoundingClientRect();
  cursorPos.value = {
    x: Math.round(tr.left - sr.left + tr.width * 0.6),
    y: Math.round(tr.top - sr.top + tr.height * 0.65),
  };
}

function pulseClick(): void {
  cursorClicking.value = true;
  if (clickPulseTimer) clearTimeout(clickPulseTimer);
  clickPulseTimer = setTimeout(() => {
    cursorClicking.value = false;
  }, 360);
}

function stopAutoplay(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
  playing.value = false;
}

function selectCandidate(id: string, manual = true): void {
  if (manual) stopAutoplay();
  focusedId.value = id;
  const item = items.value.find((i) => i.id === id);
  if (item) {
    lastActionHint.value = `已选中候选 ${item.label}（置信度 ${item.confidence}）。`;
  }
}

function cycleNext(manual = true): void {
  if (manual) stopAutoplay();
  const pool = pendingItems.value;
  if (!pool.length) {
    lastActionHint.value = "所有待审候选已处理完毕，可重置演示。";
    return;
  }
  const idx = pool.findIndex((i) => i.id === focusedId.value);
  const next = pool[(idx + 1) % pool.length];
  focusedId.value = next.id;
  syncCursorTo("tab");
  pulseClick();
  lastActionHint.value = `Tab 跳过并切换到 ${next.label}，原候选保留在 AI 待审列表。`;
}

function decideFocused(decision: "accepted" | "rejected", manual = true): void {
  if (manual) stopAutoplay();
  const current = focusedItem.value;
  if (!current || current.status !== "pending") return;

  current.status = decision;
  syncCursorTo(decision === "accepted" ? "accept" : "reject");
  pulseClick();

  const remaining = pendingItems.value;
  if (autoAdvance.value && remaining.length > 0) {
    focusedId.value = remaining[0].id;
    lastActionHint.value =
      decision === "accepted"
        ? `按 A 接受 ${current.label} 为正式 Annotation，焦点自动前进到 ${remaining[0].label}。`
        : `按 D 拒绝 ${current.label}，焦点自动前进到 ${remaining[0].label}。`;
  } else {
    lastActionHint.value =
      decision === "accepted"
        ? `已接受 ${current.label}，待审列表清空。`
        : `已拒绝 ${current.label}，待审列表清空。`;
  }
}

function resetDemo(manual = true): void {
  if (manual) stopAutoplay();
  items.value = INITIAL_CANDIDATES.map((c) => ({ ...c, rect: { ...c.rect } }));
  focusedId.value = "cand-1";
  autoStepIndex = 0;
  lastActionHint.value = "已重置待审队列：3 个 AI 候选等待审阅。";
}

function togglePlayback(): void {
  if (playing.value) {
    stopAutoplay();
    return;
  }
  if (pendingItems.value.length === 0) resetDemo(false);
  playing.value = true;
  const sequence: Array<() => void> = [
    () => cycleNext(false),
    () => decideFocused("accepted", false),
    () => decideFocused("rejected", false),
    () => decideFocused("accepted", false),
  ];
  timer = setInterval(() => {
    if (autoStepIndex >= sequence.length || pendingItems.value.length === 0) {
      stopAutoplay();
      return;
    }
    sequence[autoStepIndex++]();
  }, 1900);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Tab") {
    event.preventDefault();
    cycleNext(true);
  } else if (event.key.toLowerCase() === "a") {
    event.preventDefault();
    decideFocused("accepted", true);
  } else if (event.key.toLowerCase() === "d") {
    event.preventDefault();
    decideFocused("rejected", true);
  }
}

onMounted(() => {
  syncCursorTo("accept");
});

onBeforeUnmount(() => {
  stopAutoplay();
  if (clickPulseTimer) clearTimeout(clickPulseTimer);
});
</script>

<template>
  <DemoFrame
    title="AI 候选键盘审阅 · 标注详情"
    badge="Tab / A / D"
    badge-tone="ai"
    aria-label="AI 候选键盘审阅与自动前进交互演示"
  >
    <div
      ref="stageRef"
      tabindex="0"
      class="relative grid gap-3 rounded-[var(--yoao-radius)] border border-border bg-surface p-3 outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[1.35fr_0.95fr]"
      @keydown="onKeydown"
    >
      <div class="relative overflow-hidden rounded-[var(--yoao-radius-sm)] border border-divider bg-bg-subtle">
        <div
          class="flex items-center justify-between border-b border-divider bg-surface px-3 py-1.5 font-mono text-[10px] text-fg-subtle"
        >
          <span>CANVAS · T-COCO-014</span>
          <span class="text-ai">自动前进：开启</span>
        </div>

        <svg viewBox="0 0 460 220" class="block h-auto w-full select-none" aria-hidden="true">
          <path d="M0 176 L460 176" stroke="var(--yoao-rail-strong)" stroke-width="1" />
          <path
            d="M0 132 L460 132"
            stroke="var(--yoao-divider)"
            stroke-width="1"
            stroke-dasharray="8 8"
          />
          <rect x="60" y="102" width="80" height="44" rx="6" fill="var(--yoao-surface-alt)" stroke="var(--yoao-border-strong)" />
          <rect x="200" y="80" width="104" height="58" rx="6" fill="var(--yoao-surface-alt)" stroke="var(--yoao-border-strong)" />
          <rect x="366" y="114" width="48" height="44" rx="6" fill="var(--yoao-surface-alt)" stroke="var(--yoao-border-strong)" />

          <g
            v-for="item in items"
            :key="item.id"
            class="cursor-pointer"
            @click="selectCandidate(item.id, true)"
          >
            <rect
              v-if="item.status !== 'rejected'"
              :x="item.rect.x"
              :y="item.rect.y"
              :width="item.rect.w"
              :height="item.rect.h"
              rx="4"
              :fill="
                item.status === 'accepted'
                  ? 'var(--yoao-positive-soft)'
                  : 'var(--yoao-ai-soft)'
              "
              :stroke="
                item.status === 'accepted'
                  ? 'var(--yoao-positive-solid)'
                  : 'var(--yoao-ai-solid)'
              "
              :stroke-width="focusedId === item.id ? 2 : 1.25"
              :stroke-dasharray="item.status === 'pending' ? '5 3' : undefined"
            />
            <rect
              v-if="item.status !== 'rejected'"
              :x="item.rect.x"
              :y="item.rect.y - 18"
              width="78"
              height="16"
              rx="3"
              :fill="
                item.status === 'accepted'
                  ? 'var(--yoao-positive-solid)'
                  : 'var(--yoao-ai-solid)'
              "
            />
            <text
              v-if="item.status !== 'rejected'"
              :x="item.rect.x + 6"
              :y="item.rect.y - 7"
              fill="var(--yoao-paper-white)"
              font-size="9.5"
              font-family="var(--docs-font-mono)"
              font-weight="600"
            >
              {{ item.label }} · {{ item.status === "accepted" ? "已采纳" : item.confidence }}
            </text>
          </g>
        </svg>
      </div>

      <div class="flex flex-col justify-between gap-2.5 rounded-[var(--yoao-radius-sm)] border border-divider bg-surface p-2.5">
        <div>
          <div class="flex items-center justify-between gap-2 pb-2">
            <span class="text-[12px] font-semibold text-fg">标注详情</span>
            <div class="flex items-center gap-1.5 font-mono text-[10px]">
              <span class="rounded-full border border-ai-border bg-ai-soft px-1.5 py-0.5 text-ai">
                待审 {{ pendingItems.length }}
              </span>
              <span
                class="rounded-full border border-positive-border bg-positive-soft px-1.5 py-0.5 text-positive"
              >
                正式 {{ acceptedCount }}
              </span>
              <span
                v-if="rejectedCount"
                class="rounded-full border border-danger-border bg-danger-soft px-1.5 py-0.5 text-danger"
              >
                拒绝 {{ rejectedCount }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <button
              v-for="item in items"
              :key="item.id"
              type="button"
              class="flex items-center justify-between rounded-[var(--yoao-radius-sm)] border px-2.5 py-1.5 text-left text-[12px] transition-colors"
              :class="
                focusedId === item.id
                  ? 'border-ai-border bg-ai-soft text-fg'
                  : 'border-divider bg-bg-subtle text-fg-muted hover:bg-surface-hover'
              "
              @click="selectCandidate(item.id, true)"
            >
              <span class="flex items-center gap-1.5 font-medium">
                <Sparkle
                  class="size-3 shrink-0"
                  :class="
                    item.status === 'accepted'
                      ? 'text-positive'
                      : item.status === 'rejected'
                        ? 'text-fg-subtle'
                        : 'text-ai'
                  "
                />
                <span :class="{ 'line-through opacity-55': item.status === 'rejected' }">
                  {{ item.label }}
                </span>
              </span>
              <span class="font-mono text-[10.5px]">
                {{
                  item.status === "accepted"
                    ? "Annotation"
                    : item.status === "rejected"
                      ? "已忽略"
                      : item.confidence
                }}
              </span>
            </button>
          </div>
        </div>

        <DemoSkeleton variant="inspector" :rows="1" />

        <div class="grid grid-cols-3 gap-1.5 pt-1">
          <button
            ref="tabBtnRef"
            type="button"
            class="inline-flex items-center justify-center gap-1 rounded-[var(--yoao-radius-sm)] border border-border bg-surface-alt px-2 py-1.5 text-[11.5px] font-medium text-fg transition-colors hover:bg-surface-hover"
            @click="cycleNext(true)"
          >
            <SkipForward class="size-3 text-fg-muted" />
            <span>Tab</span>
          </button>
          <button
            ref="acceptBtnRef"
            type="button"
            :disabled="pendingItems.length === 0"
            class="inline-flex items-center justify-center gap-1 rounded-[var(--yoao-radius-sm)] border border-positive-border bg-positive-soft px-2 py-1.5 text-[11.5px] font-semibold text-positive transition-colors hover:brightness-95 disabled:opacity-40"
            @click="decideFocused('accepted', true)"
          >
            <Check class="size-3" />
            <span>A 接受</span>
          </button>
          <button
            ref="rejectBtnRef"
            type="button"
            :disabled="pendingItems.length === 0"
            class="inline-flex items-center justify-center gap-1 rounded-[var(--yoao-radius-sm)] border border-danger-border bg-danger-soft px-2 py-1.5 text-[11.5px] font-semibold text-danger transition-colors hover:brightness-95 disabled:opacity-40"
            @click="decideFocused('rejected', true)"
          >
            <X class="size-3" />
            <span>D 拒绝</span>
          </button>
        </div>
      </div>

      <DemoCursor :x="cursorPos.x" :y="cursorPos.y" :visible="playing" :clicking="cursorClicking" />
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-[var(--yoao-radius-sm)] border border-border bg-surface-alt px-2.5 py-1 text-[12px] font-medium text-fg transition-colors hover:border-border-strong hover:bg-surface-hover"
            @click="togglePlayback"
          >
            <Pause v-if="playing" class="size-3.5 text-ai" />
            <Play v-else class="size-3.5 text-ai" />
            <span>{{ playing ? "暂停演示" : "自动演示" }}</span>
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-[var(--yoao-radius-sm)] border border-border px-2 py-1 text-[12px] text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
            @click="resetDemo(true)"
          >
            <RotateCcw class="size-3" />
            <span>重置</span>
          </button>
        </div>

        <span class="font-mono text-[11px] text-fg-subtle">点击画布或按键即可直接接管</span>
      </div>

      <div class="text-[12.5px] text-fg-muted" aria-live="polite">
        {{ lastActionHint }}
      </div>
    </template>
  </DemoFrame>
</template>
