---
title: Plugin-SDK 概览
description: Plugin-SDK 统一多语言插件开发套件概览，覆盖五个扩展点及 Python 与 JS/TS 双端工具
audience: [dev]
type: explanation
status: stable
last_reviewed: 2026-11-27
---

# Plugin-SDK（插件开发套件）

[Plugin-SDK](https://github.com/YOAO-Labs/Plugin-SDK) 是面向自定义 YOAO 插件作者的多语言 SDK 与脚手架仓库。基于统一的 `yoao-extension-manifest/v1` 清单规范，Plugin-SDK 覆盖平台全部五个扩展点（`inference`、`trainer`、`notification_channel`、`format_adapter`、`theme`）。

<div class="doc-card-grid cols-3">
  <DocLinkCard title="Python SDK 参考" desc="yoao-plugin-sdk 基础包与 7 个可选 extra" href="/plugins/sdk/python" />
  <DocLinkCard title="JS / TypeScript SDK" desc="零依赖 @yoao/plugin-sdk 与主题/清单校验" href="/plugins/sdk/javascript" />
  <DocLinkCard title="CLI 检查与镜像打包" desc="yoao-plugin 与 yoao-plugin-js 命令行参考" href="/plugins/sdk/cli-and-packaging" />
</div>

## 两条快速开发路径

- **自定义推理服务**：从[快速开发推理插件](./inference-quickstart)开始，使用 `yoao-plugin-sdk[inference]` 初始化检测插件并完成本地 `dev` 与 `check` 验收；若需从裸 HTTP 框架起步，见[从零编写兼容 HTTP 后端](../protocols/http-from-scratch)。
- **自定义训练器插件**：从[开发自定义训练器插件](./trainer-quickstart)开始，使用 `yoao-plugin-sdk` 复用原子产物写入、事件流、取消收据与输入成员证明。
- **通知渠道、格式适配器与主题**：零第三方依赖场景优先参考 [@yoao/plugin-sdk](./javascript) 或使用 `yoao-plugin init --type {notification_channel,format_adapter,theme}` 生成工程模板。

## 与 Platform API SDK（`yoao-sdk`）的区别

| 维度 | Plugin-SDK（本节） | Platform API SDK（[前往 /sdk/](/sdk/)） |
| --- | --- | --- |
| 目标读者 | 插件作者（在插件容器或服务端内部使用） | 自动化脚本、集成方与平台运维/管理员 |
| 核心包 | `yoao-plugin-sdk`（Python） / `@yoao/plugin-sdk`（JS） | `yoao-sdk`（Python）与 `yoao` CLI / TUI |
| 核心职责 | 实现 `yoao-inference/v2`、`yoao-trainer/v1` 等插件服务端与契约校验 | 调用平台 REST / WebSocket API 与 `yoao plugins` 管理部署 |
| 平台依赖 | 仅 `[inference]` / `[inference-runtime]` 依赖 `yoao-sdk[protocol]` | 面向已运行的 YOAO Core 平台实例 |

`yoao-plugin-sdk` 不锁定 PyTorch 或 TorchVision 版本；每个插件自行维护独立的 Python/Node 版本与机器学习框架栈。
