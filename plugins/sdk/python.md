---
title: Python SDK 参考（yoao-plugin-sdk）
description: yoao-plugin-sdk 的模块架构、7 个可选 extra、安装方式与扩展点协议模型参考
audience: [dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# Python SDK 参考（`yoao-plugin-sdk`）

`yoao-plugin-sdk`（源码位于 `Plugin-SDK/packages/python/`，要求 Python `>=3.10`）为五个扩展点提供统一清单模型、鉴权辅助、协议校验与共享运行时组件。下方的包版本、依赖列表与 CLI 子命令由脚本从 `Plugin-SDK` 源码提取生成。

<!-- plugin-sdk-python:start -->

## 包信息与可选依赖（extras）

- **包名**：`yoao-plugin-sdk`（当前版本 `0.1.0`，Python `>=3.10`，License：MIT）
- **基础依赖**：仅 `pydantic>=2.5`，不锁定 PyTorch、TorchVision 或 OpenCV 版本
- **CLI 入口**：`yoao-plugin = "yoao_plugin_sdk.cli:main"`（基础命令：`version`、`validate`、`init`、`trainer check`；推理 extra 增加 `dev`、`check`、`build`）

| Extra | 运行时依赖 | 适用场景与主要命名空间 |
| --- | --- | --- |
| 基础包（无 extra） | `pydantic>=2.5` | `yoao_plugin_sdk.{manifest,auth,cli,inference,trainer,notification,format_adapter}` |
| `[inference-runtime]` | 无额外运行时依赖 | `yoao_plugin_sdk.inference.runtime`（LRU 池、追踪会话、受管 GPU 生命周期、`plugin_service`） |
| `[inference]` | 无额外运行时依赖 | `DetectionProvider` / `create_detection_app` 作者接口与 `dev` / `check` / `build` 命令 |
| `[mask]` | `numpy>=1.24`, `opencv-python-headless>=4.8`, `shapely>=2.0` | `yoao_plugin_sdk.inference.mask_utils`（掩码转多边形、COCO RLE、交互提示适配） |
| `[qualification]` | `PyJWT>=2.8,<3`, `uvicorn>=0.29` | `yoao_plugin_sdk.inference.runtime.qualification_http`（环回准入验证辅助） |
| `[notification]` | `httpx>=0.27` | `yoao_plugin_sdk.notification` 配合异步 HTTP 客户端测试与服务 |
| `[format]` | 无额外运行时依赖 | 声明格式适配器扩展点依赖边界 |
| `[trainer]` | 无额外运行时依赖 | 声明训练器扩展点依赖边界 |

<!-- plugin-sdk-python:end -->

## 核心模块与导出符号

### 1. 清单与凭据辅助（基础包）

- `yoao_plugin_sdk.manifest`（顶层 `yoao_plugin_sdk` 同步重导出）：
  - `EXTENSION_MANIFEST_SCHEMA`（`"yoao-extension-manifest/v1"`）、`EXTENSION_POINTS`
  - `ExtensionManifestV1`、`ExtensionResourceV1`、`validate_manifest_dict`、`load_manifest_file`
- `yoao_plugin_sdk.auth`：
  - `verify_bearer_token`：基于 `hmac.compare_digest` 的恒定时间 Bearer 鉴权辅助
  - `read_secret`：支持直接环境变量与 `*_FILE` 只读文件的凭据读取，拒绝两者同时配置

### 2. 训练器运行时与契约（`yoao_plugin_sdk.trainer`）

全部组件零 ML 框架依赖，供训练器插件直接复用：

- `protocol`：`TrainerCapabilitiesV1`、`ValidateConfigResultV1`、`TrainSpecV1`、`TrainEventV1`、`TrainReceiptV1`、`PreviewSpecV1`、`PreviewReportV1`、`canonical_json_bytes`、`canonical_json_digest`
- `files`：`digest_file`、`atomic_write_bytes`、`atomic_write_json`、`immutable_copy`、`sync_directory`
- `errors`：`TrainerError`、`InputMismatchError`、`NativeConfigurationMismatch`、`NativeRuntimeMismatch`、`DatasetContractError`、`classify_failure`、`sanitize_failure_message`
- `runtime`：`EventEmitter`、`CheckpointSlotStore`、`SUPERVISOR_OWNED_ARTIFACTS`、`build_artifact_entry`、`load_dataset_identity`、`run_with_signal_receipt`
- `membership`：`InputMembership`、`POLICY_DIGEST`、`member_records`、`contract_for`、`observed_members`
- `dataset` & `validation` & `cli`：`validate_source_lineage`、`validate_frozen_manifest_core`、`validate_sample_files`、`validate_yolo_bbox_label`、`validate_value`、`normalized`、`metrics_of`、`TrainerPlugin`、`run_trainer_cli`

### 3. 通知与格式模型（`notification` & `format_adapter`）

- `yoao_plugin_sdk.notification`：`NOTIFICATION_CHANNEL_PROTOCOL`、`DeliveryEnvelope`、`DeliverRequest`、`DeliverResult`
- `yoao_plugin_sdk.format_adapter`：`FORMAT_ADAPTER_PROTOCOL`、`ParsedAnnotation`、`ParsedItem`、`ImportParseResponse`

### 4. 推理创作接口与共享运行时

- `yoao_plugin_sdk.inference.authoring`（由 `[inference]` 提供，顶层 `yoao_plugin_sdk.inference` 延迟导出）：`Detection`、`DetectionConfig`、`DetectionModel`、`DetectionProvider`、`create_detection_app`、`load_manifest`
- `yoao_plugin_sdk.inference.runtime`（由 `[inference-runtime]` 提供）：`ManagedLruPool`、`TrackerSessionManager`、`ManagedGpuLifecycle`、`plugin_service`、`backend_auth` 等
- `yoao_plugin_sdk.inference.mask_utils`（由 `[mask]` 提供）：`mask_to_polygon`、`mask_to_multi_polygon`、`mask_to_preview_polygon`、`normalize_coords`、`encode_coco_rle`、`decode_coco_rle`、`validate_coco_rle`

::: tip 与早期包的对应关系
早期独立发行的 `yoao-inference-plugin-sdk` 已合入统一包 `yoao-plugin-sdk[inference]`，共享运行时与掩码工具亦已并入 `[inference-runtime]` 与 `[mask]` extra。仅 `[inference-runtime]` 和 `[inference]` 需要平台 `yoao-sdk[protocol]` 便携契约包。
:::

## 安装命令示例

```sh
# 仅开发训练器、通知渠道、格式适配器或清单校验工具
python -m pip install yoao-plugin-sdk

# 开发推理插件（需从可信 wheelhouse 提供 yoao-sdk[protocol]）
python -m pip install "yoao-plugin-sdk[inference]"

# 运行完整测试（在 Plugin-SDK/packages/python 目录）
python -m pytest tests/test_sdk.py tests/trainer
```

## 相关页面

- [快速开发推理插件](./inference-quickstart)
- [开发自定义训练器插件](./trainer-quickstart)
- [CLI 检查与镜像打包](./cli-and-packaging)
