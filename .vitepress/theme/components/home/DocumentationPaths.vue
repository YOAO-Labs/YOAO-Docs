<script setup lang="ts">
import type { Component } from "vue";
import { withBase } from "vitepress";
import { ArrowUpRight, BookOpen, Code2, Database, Puzzle, Server, Wrench } from "lucide-vue-next";
import FrameSection from "./FrameSection.vue";
import {
  HOME_SECTIONS,
  HOME_STATS,
  type DocPathCard,
  type DocPathIconKey,
} from "./home-contract";

const ICON_BY_KEY: Record<DocPathIconKey, Component> = {
  workbench: BookOpen,
  datasets: Database,
  plugins: Puzzle,
  api: Code2,
  ops: Server,
  dev: Wrench,
};

const paths: readonly DocPathCard[] = [
  {
    no: "01 / WORKBENCH & AI",
    title: "使用指南与工作台",
    desc: "创建项目、完成图像、视频与 3D 点云标注，借助 AI 辅助与质量审核交付稳定真值。",
    link: "进入使用指南",
    href: withBase("/user-guide/"),
    iconKey: "workbench",
    subLinks: [
      { label: "快速开始", href: withBase("/user-guide/getting-started") },
      { label: "多模态工作台", href: withBase("/user-guide/workbench/") },
      { label: "AI 辅助标注", href: withBase("/user-guide/ai/") },
      { label: "审核流程", href: withBase("/user-guide/review/") },
    ],
  },
  {
    no: "02 / DATA & LEARNING",
    title: "数据集、存储与在线学习",
    desc: "管理托管与零拷贝来源、跨网络只读站点 Agent，冻结训练数据版本并驱动模型回流。",
    link: "探索数据与训练",
    href: withBase("/user-guide/datasets/"),
    iconKey: "datasets",
    subLinks: [
      { label: "数据集工作台", href: withBase("/user-guide/datasets/workbench") },
      { label: "零拷贝与站点 Agent", href: withBase("/user-guide/datasets/site-agents") },
      { label: "训练数据版本", href: withBase("/user-guide/online-learning/data-versions") },
      { label: "模型回流与主动学习", href: withBase("/user-guide/online-learning/models") },
    ],
  },
  {
    no: "03 / EXTEND",
    title: "插件生态与扩展协议",
    desc: "安装官方推理、训练、通知与格式插件，或基于双语 Plugin-SDK 开发自定义扩展。",
    link: "探索插件生态",
    href: withBase("/plugins/"),
    iconKey: "plugins",
    subLinks: [
      { label: `${HOME_STATS.officialPlugins.total} 个官方插件`, href: withBase("/plugins/official/") },
      { label: "安装与资格验收", href: withBase("/plugins/manage/") },
      { label: "Plugin-SDK", href: withBase("/plugins/sdk/") },
      { label: `${HOME_STATS.extensionPoints} 大扩展协议`, href: withBase("/plugins/protocols/") },
    ],
  },
  {
    no: "04 / INTEGRATE",
    title: "API、SDK 与 Agent",
    desc: "通过 OpenAPI、yoao-sdk、CLI 与 Textual TUI 编排任务流，或接入 AI Agent 与事件流。",
    link: "查看接口文档",
    href: withBase("/api/"),
    iconKey: "api",
    subLinks: [
      { label: `OpenAPI (${HOME_STATS.apiRoutes} 路由)`, href: withBase("/api/") },
      { label: "Python SDK", href: withBase("/sdk/") },
      { label: "yoao CLI 与 TUI", href: withBase("/sdk/cli") },
      { label: "Agent 与事件流", href: withBase("/sdk/agents") },
    ],
  },
  {
    no: "05 / DEPLOY & OPS",
    title: "部署运维与高可用",
    desc: "覆盖 Docker Compose 与局域网生产部署、只读站点 Agent、备份迁移与应急手册。",
    link: "阅读运维手册",
    href: withBase("/ops/"),
    iconKey: "ops",
    subLinks: [
      { label: "部署拓扑选择", href: withBase("/ops/deploy/") },
      { label: "只读站点 Agent", href: withBase("/ops/deploy/site-agents") },
      { label: "存储迁移与恢复", href: withBase("/ops/deploy/storage-migration-inventory") },
      { label: "监控与安全", href: withBase("/ops/observability/") },
    ],
  },
  {
    no: "06 / BUILD",
    title: "核心开发与架构",
    desc: "阅读三仓职责边界、本地多工作树开发流程、存储与渲染性能基线及版本更新日志。",
    link: "进入开发文档",
    href: withBase("/dev/"),
    iconKey: "dev",
    subLinks: [
      { label: "本地多工作树开发", href: withBase("/dev/tutorials/local-dev") },
      { label: "系统架构地图", href: withBase("/dev/concepts/") },
      { label: "性能基线", href: withBase("/dev/reference/dataset-workbench-benchmark") },
      { label: "更新日志", href: withBase("/changelog/") },
    ],
  },
];
</script>

<template>
  <FrameSection :id="HOME_SECTIONS.paths.id" corners="both">
    <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div>
        <span class="font-mono text-[11px] tracking-[0.12em] text-fg-subtle uppercase">
          {{ HOME_SECTIONS.paths.kicker }}
        </span>
        <h2 class="mt-3 text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.2] tracking-[-0.03em] text-fg">
          按角色与任务进入文档
        </h2>
      </div>
      <p class="max-w-[440px] text-[15px] leading-relaxed text-fg-muted">
        不是零散的功能清单。每个入口都直接回答你是谁、要完成什么任务，以及下一步从哪里开始。
      </p>
    </div>

    <div
      class="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--yoao-radius-lg)] border border-rail bg-rail md:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="item in paths"
        :key="item.no"
        class="group flex flex-col justify-between bg-bg p-5 transition-colors hover:bg-surface-alt/60 sm:p-6"
      >
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[10.5px] tracking-[0.1em] text-fg-subtle uppercase">
              {{ item.no }}
            </span>
            <span
              class="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--yoao-radius-sm)] border border-border bg-surface text-fg-muted transition-colors group-hover:border-border-strong group-hover:text-fg"
            >
              <component :is="ICON_BY_KEY[item.iconKey]" class="size-4" aria-hidden="true" />
            </span>
          </div>

          <h3 class="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-fg">
            {{ item.title }}
          </h3>
          <p class="mt-2 text-[13.5px] leading-relaxed text-fg-muted">
            {{ item.desc }}
          </p>

          <div class="mt-4 flex flex-wrap gap-1.5">
            <a
              v-for="sub in item.subLinks"
              :key="sub.href"
              :href="sub.href"
              class="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11.5px] text-fg-muted no-underline transition-colors hover:border-border-strong hover:text-fg"
            >
              {{ sub.label }}
            </a>
          </div>
        </div>

        <a
          :href="item.href"
          class="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent no-underline transition-colors hover:text-accent-hover"
        >
          <span>{{ item.link }}</span>
          <ArrowUpRight
            class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </a>
      </div>
    </div>
  </FrameSection>
</template>
