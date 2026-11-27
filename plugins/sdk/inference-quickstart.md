---
title: 快速开发推理插件
description: 使用 yoao-plugin-sdk[inference] 创建目标检测插件，运行本地开发服务、fixtures 检查与本地 GPU 资格验证
audience: [dev]
type: tutorial
status: stable
last_reviewed: 2026-11-27
---

# 快速开发推理插件

本教程演示如何使用 `yoao-plugin-sdk[inference]` 在本机初始化一个可运行的 CPU 目标检测示例插件、运行契约与推理准确率检查，并进一步部署为直连 HTTP 服务或受管容器镜像。

如果你已有任意语言的 HTTP 模型服务，仅需按协议接入平台，可以直接查看[从零编写兼容 HTTP 后端](../protocols/http-from-scratch#direct-registration)。

## 1. 准备开发依赖

`yoao-plugin-sdk[inference]` 提供 `Detection`、`DetectionModel`、`DetectionProvider`、`create_detection_app` 与 `yoao-plugin` 开发命令，不绑定 Torch 或任何模型权重。因为 `[inference]` 依赖来自主仓的便携协议包 `yoao-sdk[protocol]`，在离线或受控环境请从可信 wheelhouse 安装。

> 历史包 `yoao-inference-plugin-sdk` 已整合入统一的 `yoao-plugin-sdk[inference]` 分发包，CLI 仍为 `yoao-plugin`。

```bash
python3.11 -m venv .venv
source .venv/bin/activate
export PIP_NO_INDEX=1
export PIP_FIND_LINKS=/path/to/wheelhouse
python -m pip install 'yoao-plugin-sdk[inference,dev]' 'setuptools>=68' wheel
```

## 2. 生成并构建示例插件

```bash
yoao-plugin init --type inference --example ./my-detector
cd my-detector
yoao-plugin validate ./manifest.json
yoao-plugin build .
python -m pip install --no-deps ./dist/*.whl
```

示例工程里的 `my_color_region_plugin.py` 是一个纯 CPU 颜色区域算法（按 RGB 像素阈值分别输出 `red-region`、`green-region`、`blue-region` 的边界框，并非预训练模型）。实现真实模型时，只需替换 `Provider.load`、`Model.predict` 与 `close` 方法，并在发布前修改包名与 `manifest.json` 中的 `plugin_id`。

## 3. 启动本地开发服务（`yoao-plugin dev`）

生成测试 Bearer 令牌文件后启动开发服务器：

```bash
umask 077
python -c 'import secrets; from pathlib import Path; Path("token").write_text(secrets.token_urlsafe(40))'
yoao-plugin dev --entrypoint my-color-region-plugin --device cpu --token-file ./token
```

`yoao-plugin dev` 仅监听 `127.0.0.1`，会隔离宿主路由/插件环境变量，自动调用 `/warmup` 预热默认检测变体并核对响应状态。若模型服务接受自定义参数，可放在 `--` 之后（不能覆盖 `--host`、`--port`、`--token-file` 与 `--device`）。

::: warning 注意
`yoao-plugin dev` 固定监听环回地址，不能直接用于平台全局注册表（注册表会拒绝 `127.0.0.1` 和 `localhost`）。生产或直连验证请使用部署入口 `serve` 并绑定私网接口。
:::

## 4. 构造样本并使用 `yoao-plugin check` 验证

生成测试图片 `multi.png` 与 `empty.png`：

```python
from PIL import Image, ImageDraw

image = Image.new("RGB", (100, 100), "black")
draw = ImageDraw.Draw(image)
draw.rectangle((10, 10, 29, 39), fill="red")
draw.rectangle((50, 40, 79, 89), fill=(0, 255, 0))
image.save("multi.png")
Image.new("RGB", (100, 100), "black").save("empty.png")
```

写入 `fixtures.json`（`box` 使用 `[x, y, width, height]` 百分比）：

```json
{
  "multi": {
    "image": "multi.png",
    "box_tolerance": 0.00001,
    "score_tolerance": 0,
    "detections": [
      { "native_class_index": 0, "label": "red-region", "box": [10, 10, 20, 30], "score": 1 },
      { "native_class_index": 1, "label": "green-region", "box": [50, 40, 30, 50], "score": 1 }
    ]
  },
  "empty": { "image": "empty.png", "box_tolerance": 0, "score_tolerance": 0, "detections": [] }
}
```

另开终端使用同一令牌执行 HTTP 契约检查：

```bash
YOAO_PLUGIN_TOKEN="$(cat ./token)" yoao-plugin check --url http://127.0.0.1:8000 --fixtures ./fixtures.json
```

`yoao-plugin check` 会检查空图、多目标检出数量、类别标签、坐标容差、分数以及未授权请求与本地路径拒绝逻辑。

## 5. 可选：本地独占 GPU 自检与镜像打包

具备 `probe` / `qualification-server` 钩子的 GPU 插件，可执行本地独占 GPU 自检，验证缺损资产拒止、设备绑定、双轮推理内存释放与签名排空/取消行为（注意该报告不代替管理员审核的平台托管资格报告）：

```bash
yoao-plugin check --qualify-local \
  --entrypoint your-gpu-provider \
  --fixtures ./fixtures.json \
  --device cuda:0 \
  --gpu-uuid GPU-实际设备UUID \
  --asset-dir ./assets \
  --exclusive-gpu \
  --report ./local-gpu-evidence.json
```

向平台交付受管 OCI 容器时，使用 `yoao-plugin build --base-image image@sha256:... --wheelhouse ... --requirements-lock ... --entrypoint ... --tag ...` 完成离线锁定构建；详细参数说明见 [CLI 检查与镜像打包](./cli-and-packaging)。若要直连测试非受管 HTTP 服务，请参阅[从零编写兼容 HTTP 后端](../protocols/http-from-scratch#direct-registration)。
