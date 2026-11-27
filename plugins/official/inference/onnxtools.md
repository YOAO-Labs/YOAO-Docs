---
title: ONNXTools 推理插件
description: yoao-onnxtools-plugin 的两阶段车辆检测与属性分类能力、模型资产与 CUDA 部署说明
audience: [super_admin, project_admin, dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# ONNXTools 推理插件

`yoao-onnxtools-plugin`（源码位于 `YOAO-Plugins/plugins/inference/onnxtools/`，当前版本 `0.3.0`）基于 `onnxtools` 与 ONNX Runtime `1.22.0` 实现两阶段车辆属性分析，遵循 [Inference Protocol v2](../../protocols/inference-v2)（v2.2）。

## 能力与模型目录

| `/setup` 模型 ID | 任务 | 组合形态 | 输入 | 输出 | ORT session 数 |
| --- | --- | --- | --- | --- | --- |
| `vehicle-attr` | `detect` | `composite`（RT-DETR + PP-LCNet） | `full_image`、`crop` | `bbox` + `vehicle_type`、`color` | 2 |
| `vehicle-detect` | `detect` | `atom`（仅 RT-DETR） | `full_image`、`crop` | `bbox` | 1 |
| `vehicle-attr-classify` | `classify` | `atom`（仅 PP-LCNet） | `full_image`、`crop` | `vehicle_type`、`color`（不产出几何框） | 1 |

- **车型（`vehicle_type`，13 类）**：`car`、`truck`、`bus`、`tanker`、`slagcar`、`fire_engine`、`mixer`、`ambulance`、`police_car`、`engineering_truck`、`hazardous_goods_vehicle`、`manned_sweeping_vehicle`、`school_bus`。
- **颜色（`color`，11 类）**：`black`、`white`、`gray`、`red`、`yellow`、`green`、`blue`、`purple`、`brown`、`pink`、`other`。
- `/setup` 为 `vehicle-attr` 与 `vehicle-attr-classify` 自报 `output_attribute_schema`，供项目直接导入属性配置。

## 模型权重与资产

仓库与构建镜像均不包含权重文件。`pretrained-model-assets.json` 记录两个 ONNX 文件的预期大小与 SHA-256 摘要：`rtdetr-2024080100.onnx`（车辆检测）与 `va_260612.onnx`（属性分类）。

- 插件模式下，须将已审核权重只读挂载至 `AAP_PLUGIN_DATA_DIR/models`。
- 独立模式下，从 `ONNXTOOLS_MODEL_DIR`（默认 `/app/models`）读取权重。

## 关键配置

容器默认入口为 `python3 -m uvicorn main:app --host 0.0.0.0 --port 8004 --workers 1`。

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ONNXTOOLS_MODEL_DIR` | `/app/models` | 独立模式模型目录（插件模式使用 `AAP_PLUGIN_DATA_DIR/models`） |
| `ONNXTOOLS_DET_MODEL` | `rtdetr-2024080100.onnx` | 车辆检测 ONNX 文件名 |
| `ONNXTOOLS_VA_MODEL` | `va_260612.onnx` | 车辆属性分类 ONNX 文件名 |
| `ONNXTOOLS_CONF_THRES` | `0.5` | 检测置信度阈值 |
| `ONNXTOOLS_BUILD_TIMEOUT` | `30` | 冷启动构建等待超时（秒） |
| `ONNXTOOLS_IDLE_UNLOAD_SECONDS` | `600` | 整池空闲自动卸载阈值（秒，`<=0` 关闭） |
| `ONNXTOOLS_IDLE_CHECK_INTERVAL` | `60` | 空闲检查周期（秒） |
| `LOG_LEVEL` | `INFO` | Python 日志级别 |

受管插件模式同时读取 `AAP_PLUGIN_TOKEN_FILE`、`AAP_PLUGIN_DATA_DIR`、`AAP_PLUGIN_DEVICE`、`AAP_PLUGIN_REGISTRY_ID`、`AAP_ROUTE_REGISTRY_ID`、`AAP_PLUGIN_GPU_RESOURCE_ID`、`AAP_PLUGIN_GPU_UUID`、`AAP_PLUGIN_GPU_KEYRING_FILE` 以及经审批的 CUDA 生命周期验收报告。

## 运行环境与依赖

- **Python**：`>=3.10`
- **推理栈**：固定提交 `onnxtools[inference]`、`onnxruntime-gpu==1.22.0`、`numpy==2.2.6`、`opencv-contrib-python-headless==5.0.0.93`、CUDA `12.8` 运行时镜像
- **设备策略**：独立部署在 CUDA 不可用时可回退 CPU；受管 CUDA 插件模式拒绝整条业务 session 回退 CPU，并严格核验每个 session 的 provider 链。
- **环境隔离**：顶层平铺模块（`main`、`schemas`、`predictor` 等）须安装在独立 Python 环境中。

## 许可证与合规

第一方插件源码采用 MIT 许可证。`rtdetr-2024080100.onnx` 与 `va_260612.onnx` 权重文件的来源与授权须由管理员在部署前独立核查；`pretrained-model-assets.json` 不授予下载、使用或再分发权利。

## 相关页面

- [安装官方与自定义推理插件](../../manage/inference-install)
- [全局编排库](/user-guide/projects/pipeline-library)
- [Inference Protocol v2](../../protocols/inference-v2)
