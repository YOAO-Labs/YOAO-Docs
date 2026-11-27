---
title: Platform API SDK 与 CLI
description: 面向平台自动化脚本与运维集成的 yoao-sdk Python 库、yoao CLI、Textual TUI 与 Cookbook
pageClass: docs-hub-page
aside: false
audience: [dev, project_admin, super_admin]
type: explanation
status: stable
last_reviewed: 2026-11-27
---

# Platform API SDK 与 CLI

`yoao-sdk`（Core 主仓 `packages/python-sdk/`）是官方平台 API 客户端、命令行工具（`yoao`）与终端监控面板（TUI）。用于自动化操作项目、批次、数据集、任务、在线学习与插件运维管理。

> 如果你要开发**自定义推理后端、训练器、通知渠道、格式适配器或主题插件**，请使用独立的 [Plugin-SDK（插件开发套件）](/plugins/sdk/)。

<div class="doc-card-grid">
  <DocLinkCard title="快速上手" desc="安装 yoao-sdk，配置 API Key 并完成首次查询与写入" href="/sdk/quickstart" />
  <DocLinkCard title="Python SDK 参考" desc="同步/异步客户端、资源命名空间与响应模型约束" href="/sdk/python-client" />
  <DocLinkCard title="CLI 参考" desc="yoao 全局选项、业务子命令、yoao plugins 与错误 JSON 模式" href="/sdk/cli" />
  <DocLinkCard title="TUI 与 Cookbook" desc="终端监控面板与端到端批处理自动化配方" href="/sdk/cookbook" />
</div>

## 能力分域导航

| 主题域 | 指南与参考 | 典型任务 |
| --- | --- | --- |
| Agent 与事件流 | [Agent 接入与操作](/sdk/agents) · [公开事件流与有界监听](/sdk/streams) | 离线能力发现、结构化错误码与 WebSocket/NDJSON 监听 |
| 项目、批次与任务 | [项目、批次与数据运维](/sdk/project-workflows) · [任务上下文、租约与几何工作流](/sdk/task-workflows) | 创建项目、切分批次、认领/提交/退回标注任务 |
| 数据集与存储 | [Data Explorer 与保存视图](/sdk/data-explorer) · [文件上传与数据集场景](/sdk/files-and-scenes) · [视频、模板与存储运维](/sdk/video-and-templates) | 目录同步、场景上传、视频抽帧与存储连接运维 |
| 质量、通知与运维 | [通知、反馈与预标注](/sdk/workflows) · [讨论、缺陷报告与质量处理](/sdk/annotation-quality) · [账户、管理与运维](/sdk/account-and-operations) | 成员角色管理、预标注触发、缺陷诊断与审计导出 |
| 插件部署命令行 | [CLI 参考（`yoao plugins`）](/sdk/cli#yoao-plugins) | 推理容器安装、资产批准、升级退役与训练器注册启用 |
