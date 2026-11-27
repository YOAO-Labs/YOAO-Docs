<script setup lang="ts">
import { withBase } from "vitepress";

const paths = [
  {
    no: "#01 / OPERATE",
    title: "使用平台",
    desc: "创建项目、导入数据、完成图像/视频/点云标注与质量审核。",
    link: "USER GUIDE ↗",
    href: withBase("/user-guide/"),
  },
  {
    no: "#02 / EXTEND",
    title: "插件生态",
    desc: "安装官方推理与训练插件，或基于 Plugin-SDK 构建扩展。",
    link: "PLUGINS & SDK ↗",
    href: withBase("/plugins/"),
  },
  {
    no: "#03 / INTEGRATE",
    title: "API 与 SDK",
    desc: "REST API、WebSocket 与 Platform API Python SDK / CLI / TUI。",
    link: "API & SDK ↗",
    href: withBase("/api/"),
  },
  {
    no: "#04 / BUILD & RUN",
    title: "核心开发与运维",
    desc: "核心前后端架构、本地开发、生产部署拓扑与排障手册。",
    link: "CORE & OPS ↗",
    href: withBase("/dev/"),
  },
];
</script>

<template>
  <section class="paper" id="paths">
    <div class="paper-top">
      <div>
        <span class="section-no">03 / CHOOSE YOUR PATH</span>
        <h2 class="reveal">
          <span class="paper-title-word">DOCUMENTATION</span><br />AS A WORKSPACE.
        </h2>
      </div>
      <p class="paper-note">不是功能清单。每个入口都回答：你是谁、要完成什么、下一步在哪里。</p>
    </div>
    <div class="paths reveal">
      <a v-for="p in paths" :key="p.title" class="path" :href="p.href">
        <small>{{ p.no }}</small>
        <h3>{{ p.title }}</h3>
        <p>{{ p.desc }}</p>
        <span class="path-link">{{ p.link }}</span>
        <i class="path-visual" aria-hidden="true"></i>
      </a>
    </div>
  </section>
</template>
