<script setup lang="ts">
import { withBase } from "vitepress";
import { MotionConfig } from "motion-v";
import { ArrowUpRight } from "lucide-vue-next";
import DataAtlasHero from "./home/DataAtlasHero.vue";
import DotFieldCanvas from "./home/DotFieldCanvas.vue";
import DocumentationPaths from "./home/DocumentationPaths.vue";
import DataProductionLoop from "./home/DataProductionLoop.vue";
import FrameSection from "./home/FrameSection.vue";
import PluginEcosystem from "./home/PluginEcosystem.vue";
import ProductProof from "./home/ProductProof.vue";
import { HOME_SECTIONS, HOME_STATS } from "./home/home-contract";

const finalLinks = [
  { label: "第一次使用平台", cta: "快速开始", href: withBase("/user-guide/getting-started") },
  { label: "安装或开发推理与训练插件", cta: "插件生态", href: withBase("/plugins/") },
  { label: "部署到自有基础设施与局域网", cta: "部署运维", href: withBase("/ops/") },
  { label: "脚本、CLI 与 Agent 自动化集成", cta: "API 与 SDK", href: withBase("/api/") },
] as const;

const footerRepos = [
  { label: "YOAO", href: "https://github.com/YOAO-Labs/YOAO" },
  { label: "YOAO-Plugins", href: "https://github.com/YOAO-Labs/YOAO-Plugins" },
  { label: "Plugin-SDK", href: "https://github.com/YOAO-Labs/Plugin-SDK" },
] as const;
</script>

<template>
  <MotionConfig reduced-motion="user">
    <div class="docs-home yoao-home yoao-ui bg-bg text-fg antialiased">
      <DataAtlasHero />
      <ProductProof />
      <DataProductionLoop />
      <PluginEcosystem />
      <DocumentationPaths />

      <FrameSection :id="HOME_SECTIONS.closing.id" corners="top" padding="none">
        <div class="relative overflow-hidden px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
          <DotFieldCanvas :density="26" :interactive="true" />

          <div class="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <span class="font-mono text-[11px] tracking-[0.12em] text-fg-subtle uppercase">
                {{ HOME_SECTIONS.closing.kicker }}
              </span>
              <h2 class="mt-3 text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.12] tracking-[-0.03em] text-fg">
                从第一条标注，到自托管在线学习闭环
              </h2>
              <p class="mt-4 max-w-[460px] text-[15px] leading-relaxed text-fg-muted">
                接入自有存储、推理与训练器插件，在团队内运行可审计、可扩展的多模态数据生产线。
              </p>
            </div>

            <div class="border-b border-rail bg-bg/85 backdrop-blur-sm">
              <a
                v-for="item in finalLinks"
                :key="item.href"
                :href="item.href"
                class="group flex items-center justify-between gap-4 border-t border-rail px-4 py-3.5 text-fg no-underline transition-colors hover:bg-surface-alt"
              >
                <span class="text-[14.5px] font-medium text-fg">{{ item.label }}</span>
                <span class="inline-flex shrink-0 items-center gap-1.5 font-mono text-[12px] text-accent">
                  <span>{{ item.cta }}</span>
                  <ArrowUpRight
                    class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
              </a>
            </div>
          </div>
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-4 border-t border-rail bg-surface-alt/60 px-5 py-5 font-mono text-[11.5px] text-fg-subtle sm:px-8 lg:px-12"
        >
          <span>YOAO · You Only Annotate Once</span>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>Released under the MIT License.</span>
            <span>© 2026 YOAO</span>
            <span>{{ HOME_STATS.docPages }} 页文档</span>
            <a
              v-for="repo in footerRepos"
              :key="repo.href"
              :href="repo.href"
              target="_blank"
              rel="noreferrer"
              class="text-fg-muted no-underline transition-colors hover:text-fg"
            >
              {{ repo.label }}
            </a>
          </div>
        </div>
      </FrameSection>
    </div>
  </MotionConfig>
</template>
