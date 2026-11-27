---
title: Trainer Protocol v1
description: yoao-trainer/v1 离线训练器插件标准 CLI 契约、Pydantic v1 模型、事件流与取消规范
audience: [dev, super_admin]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# Trainer Protocol v1（`yoao-trainer/v1`）

`yoao-trainer/v1` 定义 YOAO 训练监督器（`apps/training-executor`）与独立训练器插件之间的零网络离线进程契约。插件仅需通过命令行子命令接收输入清单并写出结构化产物、JSONL 事件流与不可变收据，无需访问核心数据库或对象存储凭据。

官方参考实现见 [Ultralytics 训练器插件](../official/trainer/ultralytics) 与 [LibreYOLO 训练器插件](../official/trainer/libreyolo)；作者实践指南见[开发自定义训练器插件](../sdk/trainer-quickstart)。

## 标准 CLI 子命令合同

训练器入口由 `yoao_plugin_sdk.trainer.cli.run_trainer_cli`（或等价实现）暴露以下子命令：

| 子命令 | 参数 | 核心职责与输出要求 |
| --- | --- | --- |
| `describe` | 无 | **禁止初始化 GPU 或联网**；向标准输出打印 `TrainerCapabilitiesV1` 规范 JSON |
| `validate-config` | `--spec <path>` | 校验候选训练参数、框架规则与范围约束；打印 `ValidateConfigResultV1` JSON |
| `train` | `--spec <path> --output <dir>` | 按冻结规格 `TrainSpecV1` 执行单次训练尝试，写出事件流、`input-membership.json`、检查点、产物与 `receipt.json`（`TrainReceiptV1`） |
| `preview` | `--spec <path> --output <dir>`（可选，对应 `preview` 能力） | **严格 CPU-only**（退出时 `cuda_initialized` 必须为 `false`）；依据 `PreviewSpecV1` 生成图像增强预览与 `PreviewReportV1` |

## 核心数据结构（`yoao_plugin_sdk.trainer.protocol`）

所有协议模型均启用 `extra="forbid"`，禁止未知字段；规范摘要通过 `canonical_json_bytes` 与 `canonical_json_digest` 计算（ASCII/UTF-8 排序键紧凑 JSON，`NaN` 与 `Infinity` 一律拒绝，`-0.0` 归一化为 `0.0`）。

### 1. 能力声明（`TrainerCapabilitiesV1`）

- `protocol_version`：固定 `"yoao-trainer/v1"`
- `framework_id` / `framework_version` / `runtime_versions`：框架及底层依赖（PyTorch / TorchVision 等）精确版本
- `supported_tasks` / `supported_dataset_contracts`：声明支持的视觉任务与冻结数据集契约
- `architectures`（`TrainerArchitectureV1[]`）：基础型号定义，包含 `id`、`family`、`tasks`、`end2end`、可选 `base_asset_filename` 与 `base_asset_sha256`
- `parameter_schema` / `evaluator_descriptors` / `policy_digests` / `serving_compatibility`（`ServingCompatibilityV1[]`）：用于前端渲染参数表单及回流推理兼容性校验

### 2. 配置校验（`ValidateConfigResultV1`）

- 包含 `valid`、`schema_id`、`schema_digest`、`resolved_config`、`effective_values`、`origins`、`inactive` 与 `issues`（`ValidationIssueV1[]`）。
- 强制不变量：`valid=true` 时 `issues` 必须为空且提供 `schema_id` 与 `schema_digest`；`valid=false` 时 `issues` 至少包含一条报错。

### 3. 训练规格与收据（`TrainSpecV1`、`TrainEventV1`、`TrainReceiptV1`）

- `TrainSpecV1` 携带：`run_id`、`attempt_id`、`framework_id`、`task`、`architecture_id`、`dataset_contract`、`dataset_dir`、`dataset_snapshot_digest`、`config_digest`、`classes_digest`、参数及互斥的 `resume_checkpoint_path` / `init_weights_path`。
- `TrainEventV1` 写入单调递增事件日志：`seq`（从 1 开始严格递增）、`kind`（`phase` \| `epoch` \| `progress` \| `checkpoint` \| `warning`）、`phase`、`epoch` / `total_epochs`、`progress`（0.0..1.0）、`metrics`、`detail`。
- `TrainReceiptV1` 为尝试终态权威收据：
  - `status`：`"succeeded"` \| `"failed"` \| `"cancelled"`
  - `artifacts`（`TrainArtifactV1[]`）：逐个记录 `role`（`weights` \| `checkpoint` \| `metrics` \| `config` \| `input_membership` \| `extra`）、安全文件名、`sha256` 与 `size_bytes`（禁止声明监督器保留文件名，参见 `SUPERVISOR_OWNED_ARTIFACTS`）
  - `serving_compatibility`：生成推理侧校验用运行身份
  - `failure_code` / `failure_message`：`status="failed"` 时必填，`status="succeeded"` 时必须为空

### 4. 纯 CPU 预览契约与预算限制（`PreviewSpecV1`、`PreviewReportV1`）

`yoao-trainer/v1` 对增强预览设置明确的资源硬上限：

- 单张源图：边长画素上限及像素上限 `16,000,000`（`PREVIEW_MAX_SOURCE_PIXELS`），单文件 `8 MiB`（`PREVIEW_MAX_SOURCE_BYTES`），单图框数上限 `256`
- 单批输入池：最多 `16` 张图（`PREVIEW_MAX_SOURCES`），总大小 `64 MiB`，总像素 `32,000,000`，总框数 `4,096`
- 预览输出：最多 `4` 张（`PREVIEW_MAX_OUTPUTS`），输出单边 `2560px`（`PREVIEW_MAX_EDGE`），单批输出 `24 MiB`

## 进程隔离、取消与运行约束

1. **输入成员证明（`input-membership.json`）**：平台在结束阶段校验插件产出的 `input-membership.json` 与冻结规格的 `POLICY_DIGEST` 及样本 SHA-256 一致性（使用 `yoao_plugin_sdk.trainer.membership` 与 `dataset` 模块）。
2. **原子落盘与防撕裂检查点**：所有 JSON、权重与检查点轮换必须走临时文件 + `fsync` + 原子重命名，且严禁在路径中出现符号链接。
3. **取消收口**：收到 `SIGTERM` 或 `SIGINT` 时通过 `run_with_signal_receipt` 安全终止子任务，写出 `status="cancelled"` 的 `receipt.json` 并返回标准退出码（`130` 等），禁止吞掉信号或遗留损坏产物。
4. **断网与非 root 运行**：容器运行模式固定 `--network=none`、非 root `USER` 与只读数据目录挂载。
