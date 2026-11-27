---
title: LabelMe JSON 格式适配器插件
description: yoao.format.labelme-json 的双向标注转换规则、导入选项、容器隔离配置与环境变量
audience: [super_admin, dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# LabelMe JSON 格式适配器插件

`yoao.format.labelme-json`（源码位于 `YOAO-Plugins/plugins/format-adapter/labelme-json/`，插件 ID `yoao.format.labelme-json`，格式 ID `labelme-json`，版本 `1.0.0`）是零第三方 npm 依赖的 Node.js（`>=20`）原生 ESM 格式适配器，实现 `yoao-format-adapter/v1` 协议与 `yoao-extension-manifest/v1` 清单规范。

插件纯离线运行（`allowed_egress_hosts: []`），不持有平台数据库凭据、用户 JWT 或管理密钥。

## 清单与转换能力

- **扩展点**：`format_adapter`（协议 `yoao-format-adapter/v1`）
- **能力列表**：`import`、`export`
- **支持媒体类型**：`image`
- **几何转换规则**：
  - `import`：将 LabelMe `rectangle`（2 点）转为 YOAO `bbox`，`polygon`（至少 3 点）转为 YOAO `polygon`，归一化坐标至 `[0, 1]` 并应用显式标签映射；支持单个 JSON 对象或对象数组（请求体上限 `16 MiB`）。
  - `export`：将 YOAO 的 `bbox` 与 `polygon` 标注渲染为 LabelMe JSON 文件（`version: "5.0.0"`、`imageData: null`）。
- **选项 Schema（`option_schema`）**：`ignore_unsupported_shapes`（布尔值，默认 `true`），设为 `true` 时跳过除 `rectangle` 与 `polygon` 外的图形并返回告警，设为 `false` 时直接报错拒绝。

| HTTP 端点 | 鉴权 | 说明 |
| --- | --- | --- |
| `GET /health` | 无 | 存活检查，返回 `{"status": "ok"}` |
| `GET /setup` | Bearer 令牌 | 返回适配器元信息、能力列表与 `option_schema` |
| `POST /import/parse` | Bearer 令牌 | 将 Base64 编码的 LabelMe JSON 解析为 YOAO 标注 |
| `POST /export/render` | Bearer 令牌 | 将 YOAO 任务渲染为 Base64 编码的 LabelMe JSON 文件 |

## 部署与注册

::: code-group

```sh [Node.js 直接运行]
cd plugins/format-adapter/labelme-json
YOAO_FORMAT_ADAPTER_TOKEN="replace-with-random-token" \
HOST=127.0.0.1 \
PORT=8092 \
node src/server.mjs
```

```sh [受限非 root 容器运行]
docker build -t yoao-format-labelme-json:1.0.0 plugins/format-adapter/labelme-json
docker run --rm \
  --read-only \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --memory 128m \
  --user 1000:1000 \
  -e YOAO_FORMAT_ADAPTER_TOKEN="replace-with-random-token" \
  -p 127.0.0.1:8092:8092 \
  yoao-format-labelme-json:1.0.0
```

:::

在 YOAO 管理端格式适配器接口（`/api/v1/admin/format-adapters`）登记插件服务地址与 `YOAO_FORMAT_ADAPTER_TOKEN` 后，项目即可在导入/导出流程中调用 `labelme-json`。

## 环境变量

| 环境变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `YOAO_FORMAT_ADAPTER_TOKEN` | 是 | 无 | YOAO 平台调用本插件的 Bearer 密钥 |
| `HOST` | 否 | `127.0.0.1`（镜像 `0.0.0.0`） | HTTP 监听地址 |
| `PORT` | 否 | `8092` | HTTP 监听端口（`0` 至 `65535`） |

## 相关页面

- [通知渠道、格式与主题规范](../../protocols/notification-format-theme)
- [数据导出格式](/user-guide/reference/export-formats)
