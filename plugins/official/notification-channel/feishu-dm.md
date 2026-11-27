---
title: 飞书私信通知渠道插件
description: yoao-feishu-dm 通知渠道插件的能力接口、open_id 绑定规范、安全部署与环境变量
audience: [super_admin, dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# 飞书私信通知渠道插件

`yoao-feishu-dm`（源码位于 `YOAO-Plugins/plugins/notification-channel/feishu-dm/`，插件 ID `yoao-feishu-dm`，通道 ID `feishu_dm`，版本 `1.0.0`）是零第三方 npm 依赖的 Node.js（`>=20`）原生 ESM 插件，实现 `yoao-notification-channel/v1` 协议与 `yoao-extension-manifest/v1` 清单规范。

插件接收 YOAO 平台投递的脱敏 5 字段事件信封，使用飞书企业自建应用凭据向绑定成员的 `open_id` 发送交互式卡片消息。插件不接触平台数据库、用户 JWT、平台管理凭据或用户列表。

## 清单与安全边界

- **扩展点**：`notification_channel`（协议 `yoao-notification-channel/v1`）
- **能力列表**：`deliver`、`verify_address`
- **收件地址 Schema**：`{"open_id": "ou_..."}`（4 至 128 个字符，不允许额外属性或控制字符）
- **允许出站主机**：`open.feishu.cn`
- **资源声明**：`memory_mb: 128`（非 root 用户 `USER node`）

| HTTP 端点 | 鉴权 | 说明 |
| --- | --- | --- |
| `GET /health` | 无 | 存活检查，返回 `{"status": "ok"}` |
| `GET /setup` | Bearer 令牌 | 返回通道元信息、能力列表与 `address_schema` |
| `POST /deliver` | Bearer 令牌 | 发送通知卡片，内置基于 `delivery_id` 的内存幂等去重 |
| `POST /verify-address` | Bearer 令牌 | 发送地址验证卡片确认用户的 `open_id` |

## 前置条件与部署

1. 在飞书开放平台创建企业自建应用并启用机器人能力。
2. 开通 `im:message:send_as_bot` 权限，并发布应用使目标成员可见。
3. 准备 `FEISHU_APP_ID`、`FEISHU_APP_SECRET` 以及供 YOAO 平台调用本插件的强随机令牌 `YOAO_CHANNEL_AUTH_TOKEN`。

::: code-group

```sh [Node.js 直接运行]
cd plugins/notification-channel/feishu-dm
YOAO_CHANNEL_HOST=127.0.0.1 \
YOAO_CHANNEL_PORT=8090 \
YOAO_CHANNEL_AUTH_TOKEN="replace-with-strong-random-token" \
FEISHU_APP_ID="cli_xxxxxxxx" \
FEISHU_APP_SECRET="xxxxxxxxxxxxxxxx" \
YOAO_PUBLIC_BASE_URL="https://yoao.example.com" \
node src/server.mjs
```

```sh [受限容器运行]
docker build -t yoao-feishu-dm:1.0.0 plugins/notification-channel/feishu-dm
docker run -d \
  --name yoao-feishu-dm \
  --read-only \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --memory 128m \
  --user 1000:1000 \
  -p 127.0.0.1:8090:8090 \
  -e YOAO_CHANNEL_AUTH_TOKEN="replace-with-strong-random-token" \
  -e FEISHU_APP_ID="cli_xxxxxxxx" \
  -e FEISHU_APP_SECRET="xxxxxxxxxxxxxxxx" \
  -e YOAO_PUBLIC_BASE_URL="https://yoao.example.com" \
  yoao-feishu-dm:1.0.0
```

:::

在平台管理端通知渠道入口（`/api/v1/admin/notification-channels`）注册插件 URL 与 Bearer 令牌并启用 `feishu_dm` 后，成员即可在个人通知偏好设置中绑定并验证自己的飞书 `open_id`。

## 环境变量

密钥类变量支持直接传值或通过 `*_FILE` 指定只读凭据文件（每组二选一，不可同时设置）。

| 环境变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `YOAO_CHANNEL_HOST` | 否 | `127.0.0.1`（镜像 `0.0.0.0`） | HTTP 监听地址 |
| `YOAO_CHANNEL_PORT` | 否 | `8090` | HTTP 监听端口（`0` 至 `65535`） |
| `YOAO_CHANNEL_AUTH_TOKEN` / `*_FILE` | 是 | 无 | YOAO 平台调用本插件的 Bearer 密钥 |
| `FEISHU_APP_ID` / `*_FILE` | 是 | 无 | 飞书企业自建应用 App ID |
| `FEISHU_APP_SECRET` / `*_FILE` | 是 | 无 | 飞书企业自建应用 App Secret |
| `FEISHU_API_BASE_URL` | 否 | `https://open.feishu.cn` | 飞书开放平台 API 基址 |
| `YOAO_PUBLIC_BASE_URL` | 否 | 空 | YOAO 外部访问基址，用于生成卡片跳转链接 |
| `FEISHU_HTTP_TIMEOUT_MS` | 否 | `8000` | 单次投递共享的飞书上游总超时（毫秒，`500` 至 `9000`） |
| `FEISHU_DEDUP_TTL_MS` | 否 | `86400000` | 内存 `delivery_id` 幂等缓存保留毫秒数 |
| `FEISHU_DEDUP_MAX_ENTRIES` | 否 | `10000` | 内存幂等缓存最大条目数 |

## 相关页面

- [通知渠道、格式与主题规范](../../protocols/notification-format-theme)
- [通知中心与个人订阅偏好](/user-guide/reference/notifications)
