<script setup lang="ts">
import { ref } from "vue";
import { MotionConfig } from "motion-v";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import { Sparkle } from "lucide-vue-next";
import DocLinkCard from "./DocLinkCard.vue";
import ProjectActionsDemo from "./ProjectActionsDemo.vue";
import CandidateReviewDemo from "./demo/CandidateReviewDemo.vue";
import DotFieldCanvas from "./home/DotFieldCanvas.vue";
import FrameSection from "./home/FrameSection.vue";
import PluginEcosystem from "./home/PluginEcosystem.vue";
import WorkbenchHeroDemo from "./home/WorkbenchHeroDemo.vue";

const railTone = ref<"subtle" | "solid">("subtle");
const corners = ref<"none" | "top" | "bottom" | "both">("both");
const sampleTab = ref("tokens");

const colorSwatches = [
  { name: "bg", cssVar: "--yoao-bg", label: "主画布背景" },
  { name: "surface-alt", cssVar: "--yoao-surface-alt", label: "次级表面" },
  { name: "primary", cssVar: "--yoao-primary", label: "主按钮纯色" },
  { name: "accent", cssVar: "--yoao-accent", label: "交互强调 (Indigo)" },
  { name: "ai", cssVar: "--yoao-ai-solid", label: "AI 推理 (Violet)" },
  { name: "positive", cssVar: "--yoao-positive-solid", label: "通过 / 采纳 (Jade)" },
  { name: "caution", cssVar: "--yoao-caution-solid", label: "警告 / 进行中 (Amber)" },
  { name: "danger", cssVar: "--yoao-danger-solid", label: "危险 / 拒绝 (Ruby)" },
  { name: "info", cssVar: "--yoao-info-solid", label: "信息 / 导出 (Sky)" },
];
</script>

<template>
  <MotionConfig reduced-motion="user">
    <div class="yoao-playground yoao-ui min-h-screen bg-bg text-fg antialiased">
      <FrameSection corners="bottom" padding="hero">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span class="font-mono text-[11px] tracking-[0.12em] text-fg-subtle uppercase">
              Internal Reference · /_components
            </span>
            <h1 class="mt-3 text-[34px] font-semibold tracking-[-0.03em] text-fg">
              组件与设计令牌字典
            </h1>
            <p class="mt-2.5 max-w-[620px] text-[15px] leading-relaxed text-fg-muted">
              用于验收 YOAO-Docs 的真实浏览器色彩、明暗对比、Frame Rails 网格结构与前端模拟交互组件。使用右上角主题切换按钮可实时核对亮暗模式。
            </p>
          </div>
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-ai-border bg-ai-soft px-3 py-1 font-mono text-[11px] text-ai"
          >
            <Sparkle class="size-3" />
            <span>Radix Colors + Tailwind v4</span>
          </span>
        </div>
      </FrameSection>

      <FrameSection corners="both">
        <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-fg">1. 语义色彩令牌</h2>
        <p class="mt-1.5 text-[14px] text-fg-muted">
          所有颜色源自 <code class="font-mono text-[12.5px]">.vitepress/theme/styles/tokens.css</code>，并受 <code class="font-mono text-[12.5px]">pnpm check:tokens</code> 门禁保护。
        </p>

        <div class="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="swatch in colorSwatches"
            :key="swatch.name"
            class="overflow-hidden rounded-[var(--yoao-radius)] border border-border bg-surface"
          >
            <div
              class="h-14 border-b border-divider"
              :style="{ backgroundColor: `var(${swatch.cssVar})` }"
            ></div>
            <div class="p-3">
              <div class="font-mono text-[12px] font-semibold text-fg">{{ swatch.name }}</div>
              <div class="mt-0.5 font-mono text-[10.5px] text-fg-subtle">{{ swatch.cssVar }}</div>
              <div class="mt-1 text-[12px] text-fg-muted">{{ swatch.label }}</div>
            </div>
          </div>
        </div>
      </FrameSection>

      <FrameSection corners="both">
        <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-fg">
          2. Frame Rails 与基础原语（Reka UI + Lucide）
        </h2>
        <div class="mt-5 flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2 rounded-[var(--yoao-radius)] border border-border bg-surface p-1.5">
            <span class="px-2 font-mono text-[11px] text-fg-subtle">railTone</span>
            <button
              v-for="tone in (['subtle', 'solid'] as const)"
              :key="tone"
              type="button"
              class="rounded-[var(--yoao-radius-sm)] px-2.5 py-1 font-mono text-[11.5px]"
              :class="railTone === tone ? 'bg-surface-alt font-semibold text-fg' : 'text-fg-muted'"
              @click="railTone = tone"
            >
              {{ tone }}
            </button>
          </div>

          <div class="flex items-center gap-2 rounded-[var(--yoao-radius)] border border-border bg-surface p-1.5">
            <span class="px-2 font-mono text-[11px] text-fg-subtle">corners</span>
            <button
              v-for="c in (['none', 'top', 'bottom', 'both'] as const)"
              :key="c"
              type="button"
              class="rounded-[var(--yoao-radius-sm)] px-2.5 py-1 font-mono text-[11.5px]"
              :class="corners === c ? 'bg-surface-alt font-semibold text-fg' : 'text-fg-muted'"
              @click="corners = c"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <div class="mt-6">
          <FrameSection :rail-tone="railTone" :corners="corners" padding="compact">
            <div class="grid gap-6 md:grid-cols-2">
              <div class="flex flex-col gap-3">
                <div class="font-mono text-[11px] text-fg-subtle uppercase">Typography & Badges</div>
                <div class="text-[24px] font-semibold tracking-[-0.025em] text-fg">
                  克制工程排版示例
                </div>
                <p class="text-[14px] leading-relaxed text-fg-muted">
                  正文字号保持清晰可读，快捷键使用
                  <kbd class="rounded-[4px] border border-border bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] text-fg">
                    Tab
                  </kbd>
                  或
                  <kbd class="rounded-[4px] border border-border bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] text-fg">
                    ⌘K
                  </kbd>
                  表示。
                </p>
              </div>

              <TabsRoot v-model="sampleTab">
                <TabsList class="inline-flex gap-1 rounded-[var(--yoao-radius)] border border-border bg-surface-alt p-1">
                  <TabsTrigger
                    value="tokens"
                    class="rounded-[var(--yoao-radius-sm)] px-3 py-1 text-[12px] font-medium"
                    :class="sampleTab === 'tokens' ? 'bg-surface text-fg shadow-[var(--yoao-shadow-sm)]' : 'text-fg-muted'"
                  >
                    Cards
                  </TabsTrigger>
                  <TabsTrigger
                    value="canvas"
                    class="rounded-[var(--yoao-radius-sm)] px-3 py-1 text-[12px] font-medium"
                    :class="sampleTab === 'canvas' ? 'bg-surface text-fg shadow-[var(--yoao-shadow-sm)]' : 'text-fg-muted'"
                  >
                    DotField Canvas
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="tokens" class="mt-3">
                  <DocLinkCard
                    title="DocLinkCard 示例入口"
                    desc="细线边框与悬停箭头微动效。"
                    href="/user-guide/"
                    badge="GUIDE"
                  />
                </TabsContent>
                <TabsContent value="canvas" class="mt-3">
                  <div class="relative h-[116px] overflow-hidden rounded-[var(--yoao-radius)] border border-border bg-bg-subtle">
                    <DotFieldCanvas :density="20" :interactive="true" />
                    <div class="relative z-10 flex h-full items-center justify-center font-mono text-[11.5px] text-fg-muted">
                      移动指针体验 Canvas 点阵近距反馈
                    </div>
                  </div>
                </TabsContent>
              </TabsRoot>
            </div>
          </FrameSection>
        </div>
      </FrameSection>

      <FrameSection corners="both">
        <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-fg">
          3. 代码化交互模拟演示套件
        </h2>
        <p class="mt-1.5 text-[14px] text-fg-muted">
          首页交互式工作台以及文档内的骨架降噪模拟演示组件：
        </p>

        <div class="mt-6 flex flex-col gap-8">
          <WorkbenchHeroDemo />
          <div class="grid gap-6 lg:grid-cols-2">
            <ProjectActionsDemo />
            <CandidateReviewDemo />
          </div>
        </div>
      </FrameSection>

      <FrameSection corners="both" padding="compact">
        <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-fg">
          4. 插件生态与开发者接口（PR-05 验收区）
        </h2>
        <p class="mt-1.5 text-[14px] text-fg-muted">
          在正式合入首页前独立验收五大插件扩展点、三仓库职责边界与四组开发者 / Agent 接口切换。
        </p>
      </FrameSection>

      <PluginEcosystem />
    </div>
  </MotionConfig>
</template>
