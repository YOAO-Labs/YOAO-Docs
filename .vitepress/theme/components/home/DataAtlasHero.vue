<script setup lang="ts">
import { withBase } from "vitepress";
import { Motion } from "motion-v";
import { ArrowUpRight, Search } from "lucide-vue-next";
import FrameSection from "./FrameSection.vue";
import WorkbenchHeroDemo from "./WorkbenchHeroDemo.vue";
import { HOME_SECTIONS, HOME_STATS } from "./home-contract";

const getStartedHref = withBase("/user-guide/getting-started");
const pluginsHref = withBase("/plugins/");
const apiHref = withBase("/api/");

const capabilities: readonly string[] = [
  "图像 · 视频 · 3D 点云",
  "在线学习与模型回流",
  `${HOME_STATS.extensionPoints} 扩展点 · ${HOME_STATS.officialPlugins.total} 官方插件`,
  `${HOME_STATS.apiRoutes} API 路由 · yoao-sdk`,
  "零拷贝引用 · 站点 Agent",
  "MIT 开源 · 私有化部署",
];

function openSearch(): void {
  const btn = document.querySelector<HTMLElement>(
    ".VPNavBarSearch button, .VPNavBarSearchButton, button.DocSearch-Button",
  );
  if (btn) {
    btn.click();
    return;
  }
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }));
}
</script>

<template>
  <FrameSection :id="HOME_SECTIONS.hero.id" corners="bottom" padding="hero">
    <div
      class="pointer-events-none absolute inset-x-0 -top-12 h-[420px]"
      style="background-image: var(--yoao-signature-gradient)"
      aria-hidden="true"
    ></div>

    <div class="relative z-10 mx-auto max-w-[960px] text-center">
      <Motion
        as="div"
        :initial="{ opacity: 0, filter: 'blur(8px)', y: 12 }"
        :animate="{ opacity: 1, filter: 'blur(0px)', y: 0 }"
        :transition="{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }"
        class="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-3 py-1 font-mono text-[11px] tracking-[0.06em] text-fg-muted shadow-[var(--yoao-shadow-sm)]"
      >
        <span class="size-1.5 rounded-full bg-ai-solid" aria-hidden="true"></span>
        <span>YOAO · You Only Annotate Once</span>
      </Motion>

      <Motion
        as="h1"
        :initial="{ opacity: 0, filter: 'blur(10px)', y: 16 }"
        :animate="{ opacity: 1, filter: 'blur(0px)', y: 0 }"
        :transition="{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }"
        class="mt-5 text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.14] tracking-[-0.03em] text-fg"
      >
        从多模态 AI 标注，到在线训练与模型回流
      </Motion>

      <Motion
        as="p"
        :initial="{ opacity: 0, filter: 'blur(8px)', y: 14 }"
        :animate="{ opacity: 1, filter: 'blur(0px)', y: 0 }"
        :transition="{ duration: 0.48, delay: 0.13, ease: [0.22, 1, 0.36, 1] }"
        class="mx-auto mt-4 max-w-[700px] text-[15.5px] leading-[1.68] text-fg-muted"
      >
        开源、可私有化部署的多模态数据生产平台。覆盖图像、视频轨迹与 3D 点云工作台、零拷贝存储治理、受控在线学习闭环，以及五类插件扩展与
        yoao-sdk 自动化接口。
      </Motion>

      <Motion
        as="div"
        :initial="{ opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }"
        class="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
      >
        <a
          :href="getStartedHref"
          class="group inline-flex h-10 items-center gap-2 rounded-[var(--yoao-radius)] bg-primary px-5 text-[13.5px] font-medium text-primary-fg no-underline transition-colors hover:bg-primary-hover"
        >
          <span>开始使用</span>
          <ArrowUpRight class="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        <button
          type="button"
          class="inline-flex h-10 items-center gap-3 rounded-[var(--yoao-radius)] border border-border bg-surface px-4 text-[13.5px] text-fg-muted shadow-[var(--yoao-shadow-sm)] transition-colors hover:border-border-strong hover:text-fg"
          @click="openSearch"
        >
          <Search class="size-3.5 text-fg-subtle" />
          <span>搜索文档</span>
          <kbd
            class="rounded-[4px] border border-border bg-surface-alt px-1.5 py-0.5 font-mono text-[10.5px] text-fg-subtle"
          >
            ⌘K
          </kbd>
        </button>

        <a
          :href="pluginsHref"
          class="inline-flex h-10 items-center px-3 text-[13.5px] font-medium text-fg-muted no-underline transition-colors hover:text-fg"
        >
          插件生态
        </a>

        <a
          :href="apiHref"
          class="inline-flex h-10 items-center px-3 text-[13.5px] font-medium text-accent no-underline transition-colors hover:text-accent-hover"
        >
          API 与 SDK
        </a>
      </Motion>
    </div>

    <Motion
      as="div"
      :initial="{ opacity: 0, filter: 'blur(6px)', y: 18 }"
      :animate="{ opacity: 1, filter: 'blur(0px)', y: 0 }"
      :transition="{ duration: 0.55, delay: 0.26, ease: [0.22, 1, 0.36, 1] }"
      class="relative z-10 mt-9"
    >
      <WorkbenchHeroDemo />
    </Motion>

    <div
      class="mt-9 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-rail pt-5 font-mono text-[11px] tracking-[0.04em] text-fg-subtle"
    >
      <span v-for="cap in capabilities" :key="cap" class="inline-flex items-center gap-2">
        <span class="size-1 rounded-full bg-border-strong" aria-hidden="true"></span>
        <span>{{ cap }}</span>
      </span>
    </div>
  </FrameSection>
</template>
