---
title: 开发自定义训练器插件
description: 使用 yoao-plugin-sdk 编写、校验并打包符合 yoao-extension-manifest/v1 与 yoao-trainer/v1 的独立训练器插件
audience: [dev]
type: how-to
status: stable
last_reviewed: 2026-11-27
---

# 开发自定义训练器插件

本文说明如何使用 `yoao-plugin-sdk` 编写、校验并打包符合 `yoao-extension-manifest/v1` 与 `yoao-trainer/v1` 的独立训练器插件。整体架构与平台门禁见[在线学习与训练体系](/dev/concepts/training-datasets)，两个官方参考实现见[Ultralytics 训练器插件](../official/trainer/ultralytics)与[LibreYOLO 训练器插件](../official/trainer/libreyolo)。

## 1. 环境准备与依赖边界

基础包 `yoao-plugin-sdk`（与可选 extra `[trainer]`）仅依赖 Python `>=3.10` 和 `pydantic>=2.5`，不会绑定 PyTorch、TorchVision、Ultralytics、LibreYOLO、OpenCV、NumPy 或 `PyYAML`。训练框架与 CUDA 运行时应固定在插件自己的虚拟环境或容器镜像中。

在本地安装 `yoao-plugin-sdk` 后，先生成可运行的纯 CPU 示例插件并完成首次离线契约校验。

```sh
yoao-plugin init --type trainer --example ./my-trainer-plugin
yoao-plugin validate ./my-trainer-plugin/manifest.json
python -m pip install --no-deps --no-build-isolation ./my-trainer-plugin
yoao-plugin trainer check --manifest ./my-trainer-plugin/manifest.json --entrypoint my-trainer-plugin --preview
```

上述命令会在临时目录中构造只读冻结检测数据集，依次验证 `manifest.json`、`describe`、`validate-config`、`train`、`input-membership.json`、`SIGTERM` 取消（退出码 `130` 与 `status="cancelled"` 收据）以及 CPU-only `preview`。全部通过时返回退出码 `0`，并在标准输出打印规范 JSON 校验报告。

## 2. 复用 `yoao_plugin_sdk.trainer` 公共组件

不要在插件里重复手写原子写入、事件流、检查点轮换、信号收口或输入成员证明。`yoao_plugin_sdk.trainer` 直接提供以下无 ML 依赖组件。

| 组件模块 | 导出符号 | 解决的问题 |
| --- | --- | --- |
| `yoao_plugin_sdk.trainer.protocol` | `TrainerCapabilitiesV1`、`ValidateConfigResultV1`、`TrainSpecV1`、`TrainEventV1`、`TrainReceiptV1`、`PreviewSpecV1`、`PreviewReportV1`、`canonical_json_bytes`、`canonical_json_digest` | 严格 `extra="forbid"` 的 `yoao-trainer/v1` 线协议模型与跨仓库一致的规范 JSON 摘要 |
| `yoao_plugin_sdk.trainer.files` | `digest_file`、`atomic_write_bytes`、`atomic_write_json`、`immutable_copy`、`sync_directory` | 带临时文件清理、符号链接拒绝、`fsync` 与目录刷盘的原子落盘和不可变产物复制 |
| `yoao_plugin_sdk.trainer.errors` | `TrainerError`、`InputMismatchError`、`NativeConfigurationMismatch`、`NativeRuntimeMismatch`、`DatasetContractError`、`classify_failure`、`sanitize_failure_message` | 统一错误码映射，支持无硬依赖识别已加载的 `torch.cuda.OutOfMemoryError` 并清洗控制字符 |
| `yoao_plugin_sdk.trainer.runtime` | `EventEmitter`、`CheckpointSlotStore`、`SUPERVISOR_OWNED_ARTIFACTS`、`build_artifact_entry`、`load_dataset_identity`、`run_with_signal_receipt` | 单调 `seq` 事件流、`checkpoint-NNNN.<ext>` 与 `checkpoint.json` 防撕裂轮换、禁止声明监督器保留文件，以及 `SIGTERM` 与 `SIGINT` 收据落盘 |
| `yoao_plugin_sdk.trainer.membership` | `InputMembership`、`InputMembershipResult`、`POLICY_DIGEST`、`member_records`、`compact_members`、`contract_for`、`observed_members` | 平台 `finish` 强校验的 `input-membership.json` 证明器，`POLICY_DIGEST` 与平台 `training_contract.input_membership` 字节级一致 |
| `yoao_plugin_sdk.trainer.dataset` | `SOURCE_LINEAGE_CONTRACT`、`ordered_names`、`validate_source_lineage`、`validate_frozen_manifest_core`、`validate_sample_files`、`validate_yolo_bbox_label` | 纯标准库的冻结清单、12 字段来源谱系、目录穿越与逐段符号链接检查、样本 SHA-256 与归一化 YOLO 检测框校验 |
| `yoao_plugin_sdk.trainer.validation` | `normalized`、`validate_value`、`metrics_of`、`hash_source_files`、`optional_package_version` | 禁止 `bool` 隐式转 `int` 的严格参数值校验、过滤 `NaN` 与 `Inf` 并将 `-0.0` 归零的指标清洗以及源码哈希 |
| `yoao_plugin_sdk.trainer.cli` | `TrainerPlugin`、`build_trainer_parser`、`run_trainer_cli` | 统一接管 `describe`、`validate-config`、`train` 与可选 `preview` 子命令的参数解析、规范 JSON 输出和信号退出码 |

如果训练器需要读取 `data.yaml`，由插件自己在边界调用 `yaml.safe_load` 后把解析结果作为 `data_yaml_config` 参数传给 `validate_frozen_manifest_core`，这样基础 SDK 不必引入 `PyYAML`。

## 3. 保持框架私有逻辑在插件内部

为了避免脆弱的跨框架伪抽象，以下逻辑必须保留在各个训练器插件内，不应上提到 `yoao-plugin-sdk`。

- **权重序列化与安全加载策略**：例如 LibreYOLO 对所有 `torch.load` 强制 `weights_only=True` 与 `StrictResumeLogging`，Ultralytics 需要 `weights_only=False`、`ema` 结构核验与 `initialization` 张量指纹校验。
- **专有数据契约与预览实现**：例如 Ultralytics 的简单多边形与 `aap-instance-rle-1` 掩码解码、CPU-only 增强预览渲染及预读 8 MiB 规格上限检查。
- **框架参数 Schema 与指标映射**：各训练框架的超参字典、跨字段禁用规则、`serving_compatibility` 声明与原生评估指标别名清理。

## 4. 接入 CLI 与持续集成

实现 `TrainerPlugin` 的 `describe`、`validate_config` 与 `train` 方法后，在入口模块直接交由 `run_trainer_cli` 驱动；在 `describe` 路径保持延迟导入，不要在模块顶层导入 `torch`、训练框架或图像库。

对于依赖 GPU 才能执行 `train` 的插件，可在纯 CPU 的 CI 任务中启用 `--skip-train` 参数，持续守卫 `manifest.json`、`describe` 能力快照与 `validate-config` 契约：

```sh
yoao-plugin validate plugins/trainer/my-trainer/manifest.json
yoao-plugin trainer check \
  --manifest plugins/trainer/my-trainer/manifest.json \
  --entrypoint yoao-trainer-my-trainer \
  --skip-train
```

容器打包与平台上线时，确保镜像声明与 `manifest.json` 字节一致的 `LABEL io.yoao.plugin.manifest='...'`、以非 root 用户运行（例如 `USER 10001:10001`）、在 `--network=none` 只读挂载环境下完成训练，并由超级管理员在平台核验不可变镜像摘要与隔离冒烟报告后再注册启用（参见[注册与启用训练器插件](../manage/trainer-install)）。
