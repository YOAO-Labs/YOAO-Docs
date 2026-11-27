---
title: 通知渠道、格式适配器与主题规范
description: yoao-notification-channel/v1、yoao-format-adapter/v1 与 yoao-theme/v1 扩展协议及安全约束
audience: [dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# 通知渠道、格式适配器与主题规范

除推理与训练器外，YOAO 通过三种轻量扩展协议接入通知投递、导入/导出格式转换与控制台界面配色主题。所有扩展协议在 `Plugin-SDK` 中同时提供 Python 模型或 Node.js/CLI 验证工具。

<span id="通知渠道协议" aria-hidden="true"></span>

## 通知渠道协议（`yoao-notification-channel/v1`）

通知渠道插件作为独立 HTTP 服务部署在受控内网（例如官方[飞书私信插件](../official/notification-channel/feishu-dm)）。平台在通知事件触发或用户验证接收地址时，携带脱敏 5 字段信封调用插件，**不传递用户 JWT、数据库凭据或平台管理密钥**。

### HTTP 端点合同

| 端点 | 鉴权 | 请求 / 响应要点 |
| --- | --- | --- |
| `GET /health` | 无 | 返回 HTTP 200（`{"status": "ok"}`） |
| `GET /setup` | Bearer 令牌 | 返回通道元信息、能力（`deliver` / `verify_address`）与收件地址 JSON Schema（`address_schema`） |
| `POST /deliver` | Bearer 令牌 | 接收 `DeliverRequest`，按 `envelope.delivery_id` 做幂等去重，返回 `DeliverResult` |
| `POST /verify-address` | Bearer 令牌 | 接收 `recipient_address` 与渠道配置，向接收方投递验证信息 |

### Python 模型（`yoao_plugin_sdk.notification`）

- `DeliveryEnvelope`：`event_version`（固定 `"1.0"`）、`event`、`delivery_id`、`occurred_at`、`data`（脱敏字典）
- `DeliverRequest`：`protocol_version`（`"yoao-notification-channel/v1"`）、`channel_id`、`envelope`、`recipient_address`、`locale`（默认 `"zh-CN"`）
- `DeliverResult`：`status`（`"delivered"` \| `"retryable"` \| `"permanent"`）、可选 `provider_message_id`、`reason`、`retry_after_seconds`（5..3600 秒）

所有敏感密钥建议通过只读 `*_FILE` 环境变量读取，并用 `verify_bearer_token` 做恒定时间比对。

<span id="格式适配器协议" aria-hidden="true"></span>

## 格式适配器协议（`yoao-format-adapter/v1`）

格式适配器插件为受 Bearer 令牌保护的无状态 HTTP 转换服务（例如官方 [LabelMe JSON 插件](../official/format-adapter/labelme-json)），建议在清单中声明 `allowed_egress_hosts: []` 以纯离线沙箱方式运行。

### HTTP 端点合同

| 端点 | 鉴权 | 说明 |
| --- | --- | --- |
| `GET /health` | 无 | 返回 HTTP 200（`{"status": "ok"}`） |
| `GET /setup` | Bearer 令牌 | 返回 `format_id`、`adapter_version`、`media_types`、`capabilities`（`import` / `export`）与 `option_schema` |
| `POST /import/parse` | Bearer 令牌 | 解析上传或 Base64 内容为标准 `ImportParseResponse` |
| `POST /export/render` | Bearer 令牌 | 将 YOAO 任务列表渲染为目标格式文件内容 |

### Python 模型（`yoao_plugin_sdk.format_adapter`）

- `ParsedAnnotation`：`class_name`、`tool_unit_id`、`geometry`（归一化坐标）、可选 `source_id`、`attributes`
- `ParsedItem`：`media_path`、可选 `width`/`height`、`losses`、`warnings`、`annotations`、`mask_objects`
- `ImportParseResponse`：`protocol_version`（`"yoao-format-adapter/v1"`）、`items`

<span id="声明式主题规范" aria-hidden="true"></span>

## 声明式主题规范（`yoao-theme/v1`）

声明式主题插件不包含可执行代码或运行时进程，仅由 `manifest.json`（`extension_point: "theme"`）和一份语义 CSS Token 文件（如 `tokens.json`）组成。

### 安全与 Token 校验规则

- 顶层至少包含 `light` 或 `dark` 模式之一。
- 每个模式下定义 1 至 256 个 CSS 变量名，变量名必须严格匹配 `--sc-[a-z0-9]+(?:-[a-z0-9]+)*`。
- 每个变量值（去首尾空白后长度 <= 128 字符）仅允许合法颜色字面量（hex、`rgb`/`rgba`/`hsl`/`hsla`/`oklch`）或长度/比例单位（`px`/`rem`/`em`/`%`/`0`）。
- 显式禁止任何 CSS 注入构造：`url(`、`expression(`、`javascript:`、`@import`、`;`、`{`、`}`、`<`、`>`。

本地校验命令：

```sh
yoao-plugin validate ./manifest.json
yoao-plugin-js validate-theme ./tokens.json
```

## 相关页面

- [Extension Manifest v1](./extension-manifest)
- [Plugin-SDK（JS / TypeScript）](../sdk/javascript)
- [Plugin-SDK（Python）](../sdk/python)
