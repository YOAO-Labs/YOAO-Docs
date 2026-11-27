---
title: CLI 检查与镜像打包
description: yoao-plugin（Python）与 yoao-plugin-js（Node.js）命令行全参考，以及受控容器镜像构建规范
audience: [dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# CLI 检查与镜像打包

Plugin-SDK 提供两个互补的 CLI 工具：`yoao-plugin`（来自 Python 包 `yoao-plugin-sdk`）与 `yoao-plugin-js`（来自 Node.js 包 `@yoao/plugin-sdk`）。两者职责是本地开发与离线契约校验；生产环境下向平台注册安装请使用 Core SDK 的 `yoao plugins`（见[CLI 参考](/sdk/cli#yoao-plugins)）。

## `yoao-plugin` 命令参考

### 基础命令（默认可用，仅需 `pydantic>=2.5`）

| 命令 | 说明与主要参数 |
| --- | --- |
| `yoao-plugin version` | 输出当前安装的 `yoao-plugin-sdk` 版本号 |
| `yoao-plugin validate <manifest_path>` | 校验 `yoao-extension-manifest/v1` JSON 文件（禁止重复键、NaN/Infinity 与非法扩展点/能力组合） |
| `yoao-plugin init --type <point> [--example] <dir>` | 初始化指定扩展点清单（`<point>` 可选 `inference`、`trainer`、`notification_channel`、`format_adapter`、`theme`）；对 `inference` 与 `trainer` 支持 `--example` 生成可运行 CPU 包 |
| `yoao-plugin trainer check` | 离线校验 `yoao-trainer/v1` 训练器契约：支持 `--entrypoint`、`--arg`、`--manifest`、`--skip-train`、`--preview`、`--timeout`（默认 60s）与 `--report <json>` |

### 推理作者命令（需安装 `yoao-plugin-sdk[inference]`）

| 命令 | 说明与主要参数 |
| --- | --- |
| `yoao-plugin dev` | 在 `127.0.0.1` 启动隔离开发服务并预热默认模型：`--entrypoint`、`--device`、`--token-file`、`--port`（默认 8000），透传 serve 参数置于 `--` 之后 |
| `yoao-plugin check` | 在线契约检查：`--url` + `--fixtures`，令牌读取 `YOAO_PLUGIN_TOKEN` 或兼容变量 `AAP_PLUGIN_TOKEN`；或使用 `--qualify-local --entrypoint --device --gpu-uuid --asset-dir --exclusive-gpu --report` 运行本地独占 GPU 验收 |
| `yoao-plugin build` | 不传镜像参数时构建 wheel（`python -m build --wheel --no-isolation`）并打印 SHA-256；传入 `--base-image`、`--wheelhouse`、`--requirements-lock`、`--entrypoint`、`--tag`（可选 `--push`）时构建离线锁定 OCI 镜像 |

## `yoao-plugin-js` 命令参考

需 Node.js `>=20.0.0`，不依赖第三方 npm 包：

```sh
yoao-plugin-js validate ./manifest.json
yoao-plugin-js validate-theme ./tokens.json
```

或未全局安装时通过源码执行 `node packages/js/src/cli.mjs validate ...`。

## OCI 容器构建与上线规范

向平台交付容器运行模式的插件镜像时，须满足以下规范：

1. **不可变基础镜像与离线安装**：在 `--base-image` 中固定 `@sha256:...` 摘要；pip 安装阶段使用完整 `--wheelhouse` 与包含 `--require-hashes` 的 `--requirements-lock`，禁止构建期联网拉包或 editable 安装。
2. **清单内嵌标签**：Dockerfile 必须声明与文件字节一致的 `LABEL io.yoao.plugin.manifest='<单行紧凑 JSON>'`，方便 `yoao plugins inspect-image` 读取和审计。
3. **非 root 与只读安全运行**：声明非 root `USER`（如 `USER 10001:10001` 或 `USER node`）；推理插件写入目录统一指向 `AAP_PLUGIN_DATA_DIR`（默认 `/var/lib/aap-inference`），训练器遵循 `--network=none` 只读数据挂载。
4. **平台准入**：构建完成后记录不可变 RepoDigest（`@sha256:...`），再按[安装推理插件](../manage/inference-install)或[注册训练器插件](../manage/trainer-install)完成管理员上线。
