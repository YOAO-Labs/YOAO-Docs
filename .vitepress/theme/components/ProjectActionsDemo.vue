<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchPostEffect } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  MoreVertical,
  Pause,
  Play,
  RotateCcw,
  Upload,
} from "lucide-vue-next";
import DemoCursor from "./demo/DemoCursor.vue";
import DemoFrame from "./demo/DemoFrame.vue";
import DemoSkeleton from "./demo/DemoSkeleton.vue";

const actions = [
  {
    label: "导出标注数据",
    hint: "选择导出范围和格式，生成可下载的标注文件。",
    icon: Download,
  },
  {
    label: "复制项目配置",
    hint: "用当前项目的配置预填新建向导，任务和标注仍保留在原项目。",
    icon: Copy,
  },
  {
    label: "导入预测",
    hint: "打开导入向导，将模型预测作为待审候选导入当前项目。",
    icon: Upload,
  },
];

const step = ref(0);
const playing = ref(false);
const stageRef = ref<HTMLElement>();
const triggerRef = ref<HTMLButtonElement>();
const actionRefs = ref<HTMLButtonElement[]>([]);
const cursorPos = ref({ x: 240, y: 56 });
const current = computed(() => actions[step.value - 1]);
let timer: ReturnType<typeof setInterval> | undefined;

watchPostEffect(() => {
  const stage = stageRef.value;
  if (!stage) return;
  const target = step.value ? actionRefs.value[step.value - 1] : triggerRef.value;
  if (!target) return;
  const stageRect = stage.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  cursorPos.value = {
    x: Math.round(rect.right - stageRect.left - 14),
    y: Math.round(rect.top - stageRect.top + rect.height / 2 - 4),
  };
});

function pause(): void {
  clearInterval(timer);
  playing.value = false;
}

function selectStep(index: number): void {
  pause();
  step.value = index;
}

function togglePlayback(): void {
  if (playing.value) return pause();
  if (step.value === actions.length) step.value = 0;
  playing.value = true;
  timer = setInterval(() => {
    step.value++;
    if (step.value === actions.length) pause();
  }, 2400);
}

function closeMenu(): void {
  selectStep(0);
  triggerRef.value?.focus();
}

onBeforeUnmount(pause);
</script>

<template>
  <DemoFrame
    title="项目总览 · 行操作菜单"
    badge="Simulated UI"
    aria-label="项目行更多操作的交互演示"
  >
    <div ref="stageRef" class="relative" @keydown.esc="closeMenu">
      <div class="rounded-[var(--yoao-radius)] border border-border bg-surface shadow-[var(--yoao-shadow-sm)]">
        <div
          class="relative flex min-h-[52px] items-center justify-between gap-3 border-b border-divider px-3.5 py-2"
        >
          <div class="flex min-w-0 items-center gap-2.5">
            <span class="size-2 shrink-0 rounded-full bg-positive-solid" aria-hidden="true"></span>
            <strong class="truncate text-[13.5px] font-semibold text-fg">道路目标标注</strong>
          </div>

          <div class="relative flex items-center gap-2.5">
            <span class="demo-row-context text-[12px] text-fg-subtle" aria-hidden="true">
              设置 · 打开 · 数据管理
            </span>
            <button
              ref="triggerRef"
              type="button"
              class="inline-flex size-8 items-center justify-center rounded-[var(--yoao-radius-sm)] border transition-colors"
              :class="
                step === 0
                  ? 'border-accent-border bg-accent-soft text-accent'
                  : 'border-border bg-surface text-fg-muted hover:bg-surface-hover'
              "
              aria-label="更多操作"
              :aria-expanded="step > 0"
              @click="selectStep(step ? 0 : 1)"
            >
              <MoreVertical class="size-4" />
            </button>

            <div
              v-if="step"
              class="menu-popover absolute top-[calc(100%+6px)] right-0 z-10 w-[184px] rounded-[var(--yoao-radius)] border border-border bg-surface p-1.5 shadow-[var(--yoao-shadow-md)]"
              role="group"
              aria-label="项目操作"
            >
              <template v-for="(action, index) in actions" :key="action.label">
                <div
                  v-if="index === 1"
                  class="my-1 grid gap-1.5 border-y border-divider px-2.5 py-1.5"
                  aria-hidden="true"
                >
                  <i class="block h-1 w-1/2 rounded-full bg-divider"></i>
                  <i class="block h-1 w-1/3 rounded-full bg-divider"></i>
                </div>
                <button
                  :ref="(el) => { if (el) actionRefs[index] = el as HTMLButtonElement; }"
                  type="button"
                  class="flex min-h-[32px] w-full items-center gap-2 rounded-[var(--yoao-radius-sm)] px-2.5 py-1.5 text-left text-[13px] transition-colors"
                  :class="
                    step === index + 1
                      ? 'bg-accent-soft font-medium text-accent'
                      : 'text-fg hover:bg-surface-hover'
                  "
                  :aria-pressed="step === index + 1"
                  @click="selectStep(index + 1)"
                >
                  <component :is="action.icon" class="size-3.5 shrink-0" />
                  <span class="truncate">{{ action.label }}</span>
                </button>
              </template>
            </div>
          </div>
        </div>

        <DemoSkeleton variant="list" :rows="3" />
      </div>

      <DemoCursor :x="cursorPos.x" :y="cursorPos.y" :smooth="playing" :clicking="step > 0" />
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[var(--yoao-radius-sm)] border border-border bg-surface-alt px-2.5 py-1 text-[12.5px] font-medium text-fg transition-colors hover:border-border-strong hover:bg-surface-hover"
          @click="togglePlayback"
        >
          <Pause v-if="playing" class="size-3.5 text-accent" />
          <RotateCcw v-else-if="step === actions.length" class="size-3.5 text-accent" />
          <Play v-else class="size-3.5 text-accent" />
          <span>{{ playing ? "暂停" : step === actions.length ? "重播演示" : "播放演示" }}</span>
        </button>

        <div class="flex items-center gap-2 font-mono text-[12px] text-fg-muted tabular-nums">
          <button
            type="button"
            class="inline-flex size-7 items-center justify-center rounded-[var(--yoao-radius-sm)] border border-border transition-colors hover:bg-surface-hover disabled:cursor-default disabled:opacity-40"
            aria-label="上一步"
            :disabled="step === 0"
            @click="selectStep(step - 1)"
          >
            <ChevronLeft class="size-3.5" />
          </button>
          <span>{{ step + 1 }} / {{ actions.length + 1 }}</span>
          <button
            type="button"
            class="inline-flex size-7 items-center justify-center rounded-[var(--yoao-radius-sm)] border border-border transition-colors hover:bg-surface-hover disabled:cursor-default disabled:opacity-40"
            aria-label="下一步"
            :disabled="step === actions.length"
            @click="selectStep(step + 1)"
          >
            <ChevronRight class="size-3.5" />
          </button>
        </div>
      </div>

      <div class="grid gap-0.5 text-[13px]" aria-live="polite" aria-atomic="true">
        <strong class="font-semibold text-fg">{{ current?.label ?? "找到更多操作" }}</strong>
        <span class="text-fg-muted">{{
          current?.hint ?? "点击项目行最右侧的 ⋮，查看这个项目的操作菜单。"
        }}</span>
      </div>
    </template>
  </DemoFrame>
</template>

<style scoped>
.menu-popover {
  transform-origin: top right;
  animation: demo-menu-in 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes demo-menu-in {
  from {
    opacity: 0;
    transform: translateY(-3px) scale(0.98);
  }
}

@container (max-width: 400px) {
  .demo-row-context {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu-popover {
    animation: none;
  }
}
</style>
