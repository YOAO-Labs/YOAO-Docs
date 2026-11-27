---
title: 插件生态
description: YOAO 官方插件、安装与运行管理、Plugin-SDK 多语言开发工具及扩展协议规范
pageClass: docs-hub-page
aside: false
audience: [super_admin, project_admin, dev]
type: explanation
status: stable
last_reviewed: 2026-11-27
---

# 插件生态

YOAO 将核心平台、官方插件实现与插件开发 SDK 拆分为三个独立维护的代码仓库，通过标准化清单（`yoao-extension-manifest/v1`）与五个扩展点协议解耦协作。

<div class="doc-card-grid">
  <DocLinkCard title="官方插件目录" desc="6 个推理后端、2 个训练器、飞书通知渠道与 LabelMe 格式适配器" href="/plugins/official/" />
  <DocLinkCard title="安装与运行管理" desc="yoao plugins CLI 安装、GPU 资格核验、资产批准与历史收据迁移" href="/plugins/manage/" />
  <DocLinkCard title="Plugin-SDK（开发套件）" desc="Python 与 JS/TS 双端 SDK、脚手架、检查工具与 OCI 打包" href="/plugins/sdk/" />
  <DocLinkCard title="扩展协议规范" desc="清单 Schema、Inference v2、Trainer v1 与兼容 HTTP 后端开发指南" href="/plugins/protocols/" />
</div>

## 三仓库职责边界

| 仓库 | 定位 | 核心产出 | 文档入口 |
| --- | --- | --- | --- |
| [YOAO](https://github.com/YOAO-Labs/YOAO) | 标注平台本体 | 平台 API/Web、`yoao` 管理 CLI、存储治理与受控调度器 | [安装与管理](/plugins/manage/) · [核心开发](/dev/) |
| [YOAO-Plugins](https://github.com/YOAO-Labs/YOAO-Plugins) | 官方插件仓库 | 10 个官方插件实现、预训练清单、独立 Dockerfile 与运行锁依赖 | [官方插件目录](/plugins/official/) |
| [Plugin-SDK](https://github.com/YOAO-Labs/Plugin-SDK) | 插件作者开发套件 | `yoao-plugin-sdk`（Python）、`@yoao/plugin-sdk`（JS/TS）与验证工具 | [Plugin-SDK](/plugins/sdk/) |

## 五大扩展点与协议

| 扩展点 | 协议标识 | 运行方式 | 安装与治理入口 |
| --- | --- | --- | --- |
| `inference`（推理服务） | `yoao-inference/v2` | `container` / `direct` HTTP 服务 | [安装推理插件](/plugins/manage/inference-install) · [Inference Protocol v2](/plugins/protocols/inference-v2) |
| `trainer`（训练器） | `yoao-trainer/v1` | `training-supervisor` 拉起的断网非 root 容器或本地进程 | [注册训练器插件](/plugins/manage/trainer-install) · [Trainer Protocol v1](/plugins/protocols/trainer-v1) |
| `notification_channel`（通知渠道） | `yoao-notification-channel/v1` | 受 Bearer 保护的独立 HTTP 服务 | [飞书私信插件](/plugins/official/notification-channel/feishu-dm) · [协议规范](/plugins/protocols/notification-format-theme) |
| `format_adapter`（格式适配） | `yoao-format-adapter/v1` | 受 Bearer 保护的解析与导出 HTTP 服务 | [LabelMe JSON 插件](/plugins/official/format-adapter/labelme-json) · [协议规范](/plugins/protocols/notification-format-theme) |
| `theme`（声明式主题） | `yoao-theme/v1` | `--sc-*` 语义 CSS 变量包（静态 JSON） | [JS SDK](/plugins/sdk/javascript) · [协议规范](/plugins/protocols/notification-format-theme) |

## 从哪里开始

- **平台管理员部署官方或第三方插件**：先看[官方插件目录](./official/)核对模型与硬件栈，再按[安装与运行管理](./manage/)执行安装、资格检查与资产批准。
- **算法或插件开发者**：前往 [Plugin-SDK 概览](./sdk/)初始化脚手架，先跑通本地自检，再对照[扩展协议规范](./protocols/)接入平台。
- **自动化调用平台 API**：如果你需要编写脚本操作项目、任务、数据集合或触发安装命令，请前往 [Platform API SDK](/sdk/)。
