---
title: SAM3 推理插件
description: yoao-sam3-plugin 的 PCS 检测分割、PVS 视频跟踪、门控权重与 SAM License 说明
audience: [super_admin, project_admin, dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# SAM3 推理插件

`yoao-sam3-plugin`（源码位于 `YOAO-Plugins/plugins/inference/sam3/`，当前版本 `0.10.0`）基于 SAM 3 与 SAM 3.1（`facebookresearch/sam3`）实现 GPU 推理。插件遵循 [Inference Protocol v2](../../protocols/inference-v2)（v2.2），覆盖文本提示检测/分割（PCS）、交互式分割、PVS 交互视频跟踪与 SAM 3.1 多路文本视频跟踪。

## 能力与模型目录

| `/setup` 模型 ID | 任务 | 组合形态 | 提示类型 | 输入 | 输出 | 权重文件 |
| --- | --- | --- | --- | --- | --- | --- |
| `sam3-detection` | `detect` | `atom` | `text`（PCS） | `full_image`、`crop` | `bbox` | `checkpoints/sam3.pt` |
| `sam3-segmentation` | `segment` | `composite` | `text`（PCS） | `full_image`、`crop` | `bbox`、`polygon`（`mask` / `both`） | `checkpoints/sam3.pt` |
| `sam3-interactive-seg` | `interactive_seg` | `atom`（交互式） | `point`、`interactive_box`、`mask`、`scribble`、`exemplar` | `full_image` + 提示 | `polygon`、`mask`（支持多候选与低分辨率 logits） | `checkpoints/sam3.pt` |
| `sam3-video-interactive-tracker` | `tracker` | `composite`（PVS，交互式） | `point`、`interactive_box`、`correction_frame` | `video` + 提示 | `bbox`、`polygon`、`mask`（正反向跟踪） | `checkpoints/sam3.pt` |
| `sam3-video-tracker` | `tracker` | `composite`（SAM 3.1 Multiplex） | `text` | `video` | `bbox`、`polygon`、`mask` | `checkpoints/sam3.1_multiplex.pt` |

- 五个模型统一使用 `model_variant=sam3`；BPE 词表内置于上游 `sam3` 包中。
- PVS 持久化会话上下文绑定对应模型池条目，空闲卸载、驱逐或终态排空时立即释放。

## 模型权重与资产

仓库与构建镜像均不包含模型权重，服务启动时不自动联网下载。`sam3_plugin/pretrained-assets.json` 记录 `checkpoints/sam3.pt`（`facebook/sam3`）与 `checkpoints/sam3.1_multiplex.pt`（`facebook/sam3.1`）的路径、大小与 SHA-256 摘要。

- 插件模式下，权重挂载至 `AAP_PLUGIN_DATA_DIR/checkpoints`；独立模式下默认读取 `CHECKPOINT_DIR`（`/app/checkpoints`）。
- 两个 Hugging Face 仓库均为门控（gated）仓库；管理员须单独申请访问权限，在离线或隔离准备环境中运行 `scripts/download_checkpoints.py`，切勿将访问凭据写入容器镜像。

## 关键配置

容器默认入口为 `uvicorn main:app --host 0.0.0.0 --port 8002 --workers 1`，镜像默认设置 `HOME=/tmp` 以兼容非 root 与只读根文件系统。

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CHECKPOINT_DIR` | `/app/checkpoints` | 独立模式权重目录（插件模式使用 `AAP_PLUGIN_DATA_DIR/checkpoints`） |
| `SAM3_SCORE_THRESHOLD` | `0.5` | 默认置信度阈值 |
| `SAM3_EMBEDDING_CACHE_SIZE` | `32` | 交互式分割图像特征缓存容量 |
| `SAM3_MODEL_POOL_BUILD_TIMEOUT` | `120` | 模型池冷启动等待超时（秒） |
| `SAM3_IDLE_UNLOAD_SECONDS` | `600` | 空闲自动卸载阈值（秒，`<=0` 关闭） |
| `SAM3_IDLE_CHECK_INTERVAL` | `60` | 空闲检查周期（秒） |
| `SAM3_VIDEO_MAX_WINDOW_FRAMES` | `16` | SAM 3.1 多路文本跟踪单窗口最大帧数 |
| `SAM3_PVS_MAX_WINDOW_FRAMES` | `16` | PVS 交互式视频跟踪单窗口最大帧数 |
| `SAM3_PVS_MAX_CONTEXT_FRAMES` | `16` | PVS 持久化上下文最大帧数（大于窗口帧数时启用会话模式） |
| `SAM3_VIDEO_USE_FA3` | `0` | 设为 `1` 时在视频推理中启用 FlashAttention-3 |
| `LOG_LEVEL` | `INFO` | Python 日志级别 |

受管插件模式同时读取 `AAP_PLUGIN_TOKEN_FILE`、`AAP_PLUGIN_DATA_DIR`、`AAP_PLUGIN_DEVICE`、`AAP_PLUGIN_ASSET_MANIFEST_SHA256`、`AAP_PLUGIN_REGISTRY_ID`、`AAP_ROUTE_REGISTRY_ID`、`AAP_PLUGIN_GPU_RESOURCE_ID`、`AAP_PLUGIN_GPU_UUID`、`AAP_PLUGIN_GPU_KEYRING_FILE` 及经审批的验收报告。

## 运行环境与依赖

- **Python**：`>=3.12,<3.13`
- **推理栈**：`torch==2.7.1`、`torchvision==0.22.1`、CUDA `12.8`
- **子模块**：构建镜像前需初始化 Git 子模块 `vendor/sam3`。
- **设备策略**：强制要求 CUDA；设备不可用或构建失败时直接报错，不回退 CPU。

## 许可证与合规

第一方插件源码采用 MIT 许可证。上游 `facebookresearch/sam3` 子模块与权重（`facebook/sam3`、`facebook/sam3.1`）适用 **SAM License**，分发源码、镜像或权重前须取得门控权限并遵守 SAM License 要求。

## 相关页面

- [安装官方与自定义推理插件](../../manage/inference-install)
- [交互式智能工具 (SAM)](/user-guide/workbench/sam-tool)
- [视频 AI 追踪](/user-guide/workbench/video-propagate)
