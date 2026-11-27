---
title: 官方插件目录
description: YOAO-Plugins 仓库维护的全部 10 个官方插件总览，覆盖推理、训练、通知渠道与格式适配器
audience: [super_admin, project_admin, dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# 官方插件目录

官方插件统一在 [YOAO-Plugins](https://github.com/YOAO-Labs/YOAO-Plugins) 仓库维护。仓库源码与构建镜像均不包含模型权重、专有二进制或认证凭据；生产部署须单独准备并核验权重摘要与许可条款。

下方的目录表格由 `scripts/generate-plugin-catalog.mjs` 从 `YOAO-Plugins` 清单提取生成。

<!-- plugin-catalog:start -->

## 官方推理插件（6 个）

| 插件包 | 插件目录 | 任务与核心能力 | Python 与核心运行时 | 详细说明 |
| --- | --- | --- | --- | --- |
| `yoao-yolo-plugin` (`0.1.0`) | `plugins/inference/yolo` | `detect` / `segment` / `pose` / `obb` / 开放词汇 / 追踪 | Python `>=3.11,<3.14`，`ultralytics==8.4.183` | [YOLO](./inference/yolo) |
| `yoao-grounded-sam2-plugin` (`0.10.1`) | `plugins/inference/grounded-sam2` | 开放词汇检测、交互式分割、视频跟踪 | Python `>=3.10,<3.11`，GroundingDINO + SAM 2.1 | [Grounded-SAM2](./inference/grounded-sam2) |
| `yoao-sam3-plugin` (`0.10.0`) | `plugins/inference/sam3` | PCS 开放词汇检测/分割、交互分割、PVS 视频跟踪 | Python `>=3.12,<3.13`，`sam3` + CUDA 12.8 | [SAM3](./inference/sam3) |
| `yoao-libreyolo-plugin` (`0.1.0`) | `plugins/inference/libreyolo` | 目标检测（YOLOv9 t/s/m/c 及受控训练权重） | Python `>=3.11`，`libreyolo==1.6.0` | [LibreYOLO](./inference/libreyolo) |
| `yoao-rapidocr-plugin` (`0.1.0`) | `plugins/inference/rapidocr` | OCR 检测、方向校正与识别（PP-OCRv5/v6） | Python `>=3.10`，`rapidocr==3.9.0` + ONNX Runtime `1.23.2` | [RapidOCR](./inference/rapidocr) |
| `yoao-onnxtools-plugin` (`0.3.0`) | `plugins/inference/onnxtools` | 车辆检测、属性分类与两阶段复合管道 | Python `>=3.10`，`onnxtools` + ONNX Runtime `1.22.0` | [ONNXTools](./inference/onnxtools) |

## 官方训练器插件（2 个）

| `plugin_id` | 显示名称 | 框架与协议 | 声明能力 | 许可证 | 详细说明 |
| --- | --- | --- | --- | --- | --- |
| `yoao.trainer.ultralytics` | Ultralytics YOLO Trainer (`1.0.0`) | `ultralytics` `8.4.183` (`yoao-trainer/v1`) | `train`, `evaluate`, `preview`, `export_weights` | `AGPL-3.0-only` | [Ultralytics 训练器](./trainer/ultralytics) |
| `yoao.trainer.libreyolo` | LibreYOLO Trainer (`1.0.0`) | `libreyolo` `1.6.0` (`yoao-trainer/v1`) | `train`, `evaluate`, `export_weights` | `MIT` | [LibreYOLO 训练器](./trainer/libreyolo) |

## 官方通知渠道与格式适配器（2 个）

| 扩展点 | `plugin_id` | 显示名称 | 协议与运行时 | 能力与出站限制 | 详细说明 |
| --- | --- | --- | --- | --- | --- |
| `notification_channel` | `yoao-feishu-dm` | 飞书私信 (`1.0.0`) | `yoao-notification-channel/v1`，Node.js >=20 | `deliver`, `verify_address`（出站仅 `open.feishu.cn`） | [飞书私信](./notification-channel/feishu-dm) |
| `format_adapter` | `yoao.format.labelme-json` | LabelMe JSON (`1.0.0`) | `yoao-format-adapter/v1`，Node.js >=20 | `import`, `export`（无外部出站 `[]`） | [LabelMe JSON](./format-adapter/labelme-json) |

<!-- plugin-catalog:end -->

## 部署与合规注意事项

- **独立构建与隔离环境**：每个推理与训练器插件固定自己的 Python 次版本、PyTorch/CUDA 或 ONNX Runtime 基线，禁止混装在同一环境。
- **发现不等于可运行**：所有官方插件的容器镜像均须经过超级管理员审核不可变 `@sha256:...` 摘要、准备权重清单并完成资格验收后，才会对项目开放。
- **安装步骤**：推理后端安装见[安装官方与自定义推理插件](../manage/inference-install)，训练器注册见[注册与启用训练器插件](../manage/trainer-install)。
