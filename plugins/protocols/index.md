---
title: 扩展协议规范
description: YOAO 五大扩展点协议架构：Extension Manifest v1、Inference v2、Trainer v1 与轻量扩展协议
audience: [dev, super_admin]
type: explanation
status: stable
last_reviewed: 2026-11-27
---

# 扩展协议规范

YOAO 通过严格版本的声明清单与通信契约连接 Core 平台、官方插件与第三方扩展。插件作者可直接使用 `Plugin-SDK`，也可在任意语言或运行时中自行实现对应的 HTTP 或进程内契约。

<div class="doc-card-grid cols-3">
  <DocLinkCard title="Extension Manifest v1" desc="五类扩展点通用清单格式与字段校验规则" href="/plugins/protocols/extension-manifest" />
  <DocLinkCard title="Inference Protocol v2" desc="yoao-inference/v2 推理、交互、追踪与受控回流 HTTP 契约" href="/plugins/protocols/inference-v2" />
  <DocLinkCard title="Trainer Protocol v1" desc="yoao-trainer/v1 离线训练器 CLI 契约与事件流规范" href="/plugins/protocols/trainer-v1" />
</div>

## 协议总览

| 协议版本 | 适用扩展点 | 传输形态 | 核心入口 / 约定 |
| --- | --- | --- | --- |
| `yoao-extension-manifest/v1` | 全部扩展点 | `manifest.json`（<= 64 KiB 严格 JSON） | [Extension Manifest v1](./extension-manifest) |
| `yoao-inference/v2`（wire `2.0`/`2.1`/`2.2`） | `inference` | 受 Bearer 保护的 HTTP 服务 | [Inference Protocol v2](./inference-v2) · [从零编写兼容 HTTP 后端](./http-from-scratch) |
| `yoao-trainer/v1` | `trainer` | 断网容器或本地进程标准 CLI + JSONL 事件 | [Trainer Protocol v1](./trainer-v1) |
| `yoao-notification-channel/v1` | `notification_channel` | 受 Bearer 保护的 HTTP 服务 | [通知渠道、格式与主题规范](./notification-format-theme#通知渠道协议) |
| `yoao-format-adapter/v1` | `format_adapter` | 受 Bearer 保护的 HTTP 服务 | [通知渠道、格式与主题规范](./notification-format-theme#格式适配器协议) |
| `yoao-theme/v1` | `theme` | `--sc-*` 语义 CSS 变量 JSON 包 | [通知渠道、格式与主题规范](./notification-format-theme#声明式主题规范) |

## 版本演进与兼容约束

- **禁止静默降级或默认放行**：清单未知能力、未匹配的 `protocol_version`、越界参数或缺失的资格证据均以 fail-closed 拒绝。
- **跨语言同源校验**：`ExtensionManifestV1`、`TrainerCapabilitiesV1` 与主题校验在 Python（`yoao-plugin-sdk`）和 Node.js（`@yoao/plugin-sdk`）两端维持一致规则。
