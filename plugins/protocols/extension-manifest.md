---
title: Extension Manifest v1
description: yoao-extension-manifest/v1 通用扩展清单字段结构、严格 JSON 校验与各扩展点差异
audience: [dev, super_admin]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# Extension Manifest v1

`yoao-extension-manifest/v1` 是 YOAO 所有扩展点插件统一声明元信息、能力范围、入口命令、资源配额与安全边界的清单规范。在本地可用 `yoao-plugin validate <path>` 或 `yoao-plugin-js validate <path>` 校验。

## 顶层结构与严格解析约束

解析阶段采用严格 JSON 约束：文件 UTF-8 编码体积上限 **65,536 字节（64 KiB）**，禁止重复键，禁止 `NaN` / `Infinity` 等非有限数值，且未知顶层字段与 `source_tier`（必须由平台管理员在注册阶段赋予）一概拒绝。

| 顶层字段 | 必填 | 类型与校验约束 | 说明 |
| --- | --- | --- | --- |
| `manifest_schema` | 是 | 固定 `"yoao-extension-manifest/v1"` | 清单 Schema 标识 |
| `extension_point` | 是 | `"inference"` \| `"trainer"` \| `"notification_channel"` \| `"format_adapter"` \| `"theme"` | 扩展点类型 |
| `plugin_id` | 是 | ASCII 标识（匹配 `^[a-z0-9]+(?:[._-][a-z0-9]+)*$`，1..128 字符） | 全局唯一插件标识 |
| `version` | 是 | 可打印文本（1..128 字符） | 插件发布版本号 |
| `display_name` | 否 | 可打印文本（1..64 字符） | 控制台展示名称 |
| `description` | 否 | 可打印文本（1..280 字符） | 插件功能简述 |
| `homepage` | 否 | 公网 `https://` URL（<= 255 ASCII 字符） | 禁止 loopback、内网 IP、数字 IP 与内嵌凭据 |
| `publisher` | 是 | 可打印文本（1..255 字符） | 发布组织或作者 |
| `license` | 是 | 可打印文本（1..255 字符） | SPDX 标识或明确许可名称 |
| `protocol_version` | 是 | 须与 `extension_point` 严格对应 | 见下表映射关系 |
| `entrypoint` | 条件 | 字符串数组（1..64 项）；`theme` 可省略，推理 `direct` 模式可选 | 首项不可为 shell（如 `sh`/`bash`），禁止 `python -c` |
| `capabilities` | 是 | 非空去重数组（1..16 项），限对应扩展点允许词表 | 声明插件能力 |
| `resource` | 条件 | `{"memory_mb": <int 16..65536>}`；`theme` 与 `direct` 推理可选 | 容器内存限制 |
| `extension` | 否 | JSON 对象 | 扩展点专属元数据，见下文 |
| `artifact` | 否 | 含 `@sha256:[0-9a-f]{64}` 的 OCI 引用 | 仅由管理员绑定镜像摘要时使用；`direct` 推理禁止携带 |

## 扩展点与能力映射

| `extension_point` | 强制 `protocol_version` | 允许的 `capabilities` |
| --- | --- | --- |
| `inference` | `"yoao-inference/v2"` | 必须包含 `inference`；另可选 `detection`、`segmentation`、`interactive`、`video_tracking`、`ocr`、`classification`、`obb`、`pose`、`doc_layout`、`managed_models`、`managed_evaluation`（注：`managed_evaluation` 依赖 `managed_models`） |
| `trainer` | `"yoao-trainer/v1"` | `train`、`evaluate`、`preview`、`export_weights` |
| `notification_channel` | `"yoao-notification-channel/v1"` | `deliver`、`verify_address` |
| `format_adapter` | `"yoao-format-adapter/v1"` | `import`、`export` |
| `theme` | `"yoao-theme/v1"` | `light`、`dark` |

## 各扩展点 `extension` 字段要求

### 1. `inference`（`InferenceExtensionV1`）

- `execution_mode`：`"container"`（默认）或 `"direct"`。`container` 模式必须同时提供 `entrypoint`、`resource.memory_mb` 与 `asset_manifest_sha256`（64 位小写十六进制 SHA-256）。
- `models`（非空数组，最多 128 项）：每项包含 `id`、`task`（`detect`/`segment`/`classify`/`pose`/`obb`/`ocr`/`doc_layout`/`tracker`/`interactive_seg`）、`is_interactive`、`supported_prompts`、`supported_inputs`、`supported_geometric_outputs`。
- `pools`（非空对象，最多 128 项）：每项为 `{"cap": <正整数>}`。
- `compute`：`{"device": "cpu" | "cuda", "gpu_memory_mb": <int>}`。CPU 模式要求 `gpu_memory_mb == 0`；容器 CUDA 模式要求 `gpu_memory_mb > 0`。
- `managed_model_compatibility`：必须与 `"managed_models"` 能力声明严格一致（存在该能力时列表非空且 `runtime_device` 匹配 `compute.device`）。

### 2. `trainer` / `notification_channel` / `format_adapter` / `theme`

- `trainer`：包含 `framework_id`、`framework_version`、可选 `requires_gpu`、`supported_tasks`、`supported_dataset_contracts` 等（官方示例见 `YOAO-Plugins/plugins/trainer/ultralytics/manifest.json`）。
- `notification_channel`：包含 `channel_id`、`address_schema`（JSON Schema，约束用户接收地址格式）与 `allowed_egress_hosts`（出站域名白名单，例如 `["open.feishu.cn"]`）。
- `format_adapter`：包含 `format_id`、`adapter_version`、`manifest_version`、`media_types`、`option_schema` 与 `allowed_egress_hosts`（纯离线转换填 `[]`）。
- `theme`：包含 `theme_id` 与 `tokens_file`（指向通过 `--sc-*` 校验的 JSON 文件）。

## 容器镜像标签约定

构建生产 OCI 镜像时，须在 Dockerfile 中以单行紧凑 JSON 声明与 `manifest.json` 字节一致的镜像标签，方便 `yoao plugins inspect-image` 读取校验：

```dockerfile
LABEL io.yoao.plugin.manifest='{"manifest_schema":"yoao-extension-manifest/v1",...}'
```
