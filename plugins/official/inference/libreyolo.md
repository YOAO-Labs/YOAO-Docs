---
title: LibreYOLO 推理插件
description: yoao-libreyolo-plugin 的 YOLOv9 检测能力、受控模型回流与 FP32 精度策略
audience: [super_admin, project_admin, dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# LibreYOLO 推理插件

`yoao-libreyolo-plugin`（源码位于 `YOAO-Plugins/plugins/inference/libreyolo/`，当前版本 `0.1.0`）基于原生 LibreYOLO `1.6.0` 加载器（`yoao-libreyolo-native`）实现，不依赖 `ultralytics`。插件提供目标检测推理及受控自训模型回流能力。

## 能力与模型目录

| `/setup` 模型 ID | 任务 | 输入 | 输出 | 变体与权重 |
| --- | --- | --- | --- | --- |
| `detect` | `detect` | `full_image`、`crop` | `bbox` | 预训练 YOLOv9 `t`（默认）、`s`、`m`、`c`；受管训练权重（`trained:<model_version_id>`） |

- 预训练变体对应 `LibreYOLO9t.pt`、`LibreYOLO9s.pt`、`LibreYOLO9m.pt` 与 `LibreYOLO9c.pt`；启动前须准备默认变体 `t`。
- 受管训练权重使用 `libreyolo-native-state-dict-1.0` 格式，加载前依据不可变训练回执校验。
- 请求级参数支持 `conf`（默认 `0.25`）、`iou`（默认 `0.45`）、`max_det`（默认 `300`）与可选 `classes` 过滤。

## 模型权重与资产

插件内置版本化清单 `yoao_libreyolo_plugin/controlled-model-assets.json`，固定记录四个官方 YOLOv9 权重的文件名、来源与 SHA-256 摘要，推理中不自动下载权重。

- 管理员可在安装前执行 `yoao plugins prepare-assets --state-dir <dir> --json`，或在获准环境直接运行：

```sh
yoao-libreyolo prepare-assets --size t --asset-dir /var/lib/aap-libreyolo/assets
```

需要暴露其余规格时分别传入 `--size s`、`m` 或 `c`。完成后还须通过 `yoao plugins approve-assets` 完成本地资产测量与批准。

## 关键配置

容器默认入口为 `yoao-libreyolo serve --host 0.0.0.0 --port 8000`（以非 root UID/GID `10001` 运行）。

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `AAP_PLUGIN_TOKEN_FILE` | 必填 | 私有 Bearer 令牌文件路径（不少于 32 个字符） |
| `AAP_PLUGIN_DEVICE` | `cpu` | 运行设备（`cpu` 或 `cuda:0`） |
| `AAP_PLUGIN_ASSET_DIR` | `/var/lib/aap-libreyolo/assets` | 已校验预训练权重目录 |
| `AAP_PLUGIN_DATA_DIR` | `/var/lib/aap-libreyolo` | 私有状态目录（受管模型位于 `managed/`） |
| `AAP_PLUGIN_ASSET_ORIGINS` | 空 | 允许拉取受管模型的来源列表（逗号分隔） |
| `AAP_PLUGIN_IMAGE_HOSTS` | 空 | 允许拉取远程图像的主机列表（逗号分隔） |

受管 CUDA 部署还需 `AAP_PLUGIN_REGISTRY_ID`、`AAP_PLUGIN_GPU_RESOURCE_ID`、`AAP_PLUGIN_GPU_UUID`、`AAP_PLUGIN_GPU_KEYRING_FILE` 以及经审批的验收报告（`AAP_PLUGIN_QUALIFICATION_FILE` / `AAP_PLUGIN_QUALIFICATION_SHA256`、`AAP_PLUGIN_OCI_ARTIFACT`、`AAP_PLUGIN_IMAGE_ID`）。本地 CPU 调试可使用 `yoao-libreyolo serve --local --device cpu --host 127.0.0.1 --port 8000`。

## 运行环境与依赖

- **Python**：`>=3.11`
- **推理栈**：`libreyolo==1.6.0`、`torch==2.14.1+cu132`、`torchvision==0.29.1+cu132`（CUDA `13.2` 基线）
- **精度与回退策略**：固定 FP32 执行，禁用 half、AMP 与 TF32；CUDA 设备校验失败时直接报错，不回退 CPU。

## 许可证与合规

第一方插件与原生加载器源码采用 MIT 许可证。上游 LibreYOLO 将库代码与 YOLOv9 COCO 权重标示为 MIT；PyTorch、NVIDIA 运行时组件及随包第三方声明（含 DINOv3）仍受各自条款约束。

## 相关页面

- [安装官方与自定义推理插件](../../manage/inference-install)
- [LibreYOLO 训练器插件](../trainer/libreyolo)
- [模型回流与默认预标](/user-guide/online-learning/models)
