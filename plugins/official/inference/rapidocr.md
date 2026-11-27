---
title: RapidOCR 推理插件
description: yoao-rapidocr-plugin 的原子检测/识别模型、PP-OCRv5/v6 变体、CPU 与 CUDA 部署说明
audience: [super_admin, project_admin, dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# RapidOCR 推理插件

`yoao-rapidocr-plugin`（源码位于 `YOAO-Plugins/plugins/inference/rapidocr/`，当前版本 `0.1.0`）基于 RapidOCR `3.9.0` 与 ONNX Runtime `1.23.2` 实现，遵循 [Inference Protocol v2](../../protocols/inference-v2)（v2.2），将文本检测、方向分类与识别（`det -> cls -> rec`）拆分为可编排的原子模型与端到端复合模型。

## 能力与模型目录

| `/setup` 模型 ID | 任务 | 组合形态 | 输入 | 输出 | 可调参数 |
| --- | --- | --- | --- | --- | --- |
| `ocr-det` | `detect` | `atom` | `full_image` | `polygon` 文本框 | `box_thresh`（`0.5`）、`unclip_ratio`（`1.6`） |
| `ocr-rec` | `ocr` | `atom`（内置 `cls` 方向校正） | `crop` | `attributes.text`、`orientation`（`0`/`180`）、`language`（`universal`/`en`） | 无 |
| `ocr-e2e` | `ocr` | `composite`（`det -> cls -> rec`） | `full_image` | `polygon` + `text`、`orientation`、`language` | `box_thresh`（`0.5`）、`unclip_ratio`（`1.6`）、`text_score`（`0.5`） |

- 方向分类（`cls`，0/180 度）内化在 `ocr-rec` 与 `ocr-e2e` 中；平台全局编排也可将 `ocr-det` 与 `ocr-rec` 串联使用。
- 变体通过 `context.model_variants`（`{version, size, lang}`）选择，默认 `v5` / `mobile` / `universal`：
  - `ocr-det`：支持 PP-OCR `v5`（`mobile`、`server`）与 `v6`（`tiny`、`small`、`medium`）。
  - `ocr-rec` / `ocr-e2e`：中英通用（`universal`）支持 `v5` 与 `v6` 全部尺寸；英文（`en`）支持 `v5`（`mobile`）。
  - 内置 `cls` 自动匹配：`mobile`/`tiny`/`small` 对应 `mobile` 档，`server`/`medium` 对应 `server` 档。

## 模型权重与资产

插件使用 RapidOCR `3.9.0` 对应的 13 个 ONNX 文件（5 个检测、2 个方向分类、6 个识别），镜像本身不含权重。

- 管理员可运行 `python -m pretrained_manifest` 查看 13 个文件的路径与 SHA-256，或在获准环境中运行 `python -m download_models --models-dir /path/to/models` 下载权重。
- 插件模式下，权重挂载至 `AAP_PLUGIN_DATA_DIR/models`；须使用 `python -m plugin_assets` 生成 `data/assets.json`，启动时按摘要严格校验并拒绝清单外文件。
- RapidOCR CPU 部署将 `container_port` 设为 `8005`，生成 manifest 时默认保持 `RAPIDOCR_POOL_CAP=3`，安装时直接执行 `yoao plugins install --state-dir ./rapidocr-state --yes --json`（无需传 `--qualification`）。

## 关键配置

容器默认入口为 `python3 -m uvicorn main:app --host 0.0.0.0 --port 8005 --workers 1`。

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `RAPIDOCR_MODEL_DIR` | GPU `/app/models`；CPU `/var/lib/aap-plugin/models` | 独立模式权重根目录（插件模式使用 `AAP_PLUGIN_DATA_DIR/models`） |
| `RAPIDOCR_DEVICE` | GPU `gpu`；CPU `cpu` | 独立模式设备（插件模式读取 `AAP_PLUGIN_DEVICE`） |
| `RAPIDOCR_POOL_CAP` | `3` | 复合引擎池上限（每个引擎持有 `det`/`cls`/`rec` 三个 ORT session） |
| `RAPIDOCR_BUILD_TIMEOUT` | `30` | 冷启动构建等待超时（秒） |
| `RAPIDOCR_IDLE_UNLOAD_SECONDS` | `600` | 整池空闲自动卸载阈值（秒，`<=0` 关闭） |
| `RAPIDOCR_IDLE_CHECK_INTERVAL` | `60` | 空闲检查周期（秒） |
| `LOG_LEVEL` | `INFO` | Python 日志级别 |

受管插件模式同时读取 `AAP_PLUGIN_TOKEN_FILE`、`AAP_PLUGIN_DATA_DIR`、`AAP_PLUGIN_DEVICE` 与 `AAP_PLUGIN_ASSET_MANIFEST_SHA256`；CUDA 部署另需 Registry/GPU 绑定及验签 keyring 变量。

## 运行环境与依赖

- **Python**：`>=3.10`
- **核心依赖**：`rapidocr==3.9.0`、`numpy==2.2.6`、`opencv-python-headless==5.0.0.93`
- **CPU 与 CUDA 互斥 extra**：
  - `cpu`（`Dockerfile.cpu`）：仅 `onnxruntime==1.23.2`，无 NVIDIA wheel。
  - `cuda`（`Dockerfile`）：基于 CUDA `12.8`，使用 `onnxruntime-gpu==1.23.2` 与 `nvidia-cudnn-cu12==9.10.2.21`。
- **回退策略**：受管 CUDA 模式要求全部业务 session 以 `CUDAExecutionProvider` 为首 provider，拒绝回退 CPU。注意其 `opencv-python-headless` 替代包存在上游 `pip check` 元数据提示，不能将真实推理验收简化为 `pip check`。

## 许可证与合规

第一方插件源码采用 MIT 许可证。依据 RapidOCR 模型许可声明，`PP-OCRv6_det_small.onnx` 与 `PP-OCRv6_rec_small.onnx` 适用 Apache-2.0（须保留归属声明），其余 11 个 ONNX 权重须在部署与分发前逐项独立核验授权。

## 相关页面

- [安装官方与自定义推理插件](../../manage/inference-install)
- [全局编排库](/user-guide/projects/pipeline-library)
- [Inference Protocol v2](../../protocols/inference-v2)
