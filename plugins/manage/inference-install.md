---
title: 安装官方与自定义推理插件
description: 超级管理员使用 yoao plugins CLI 在部署机准备、资格核验、批准资产、重启、升级与卸载推理插件
audience: [super_admin]
type: how-to
status: stable
last_reviewed: 2026-11-27
---

<span id="可安装推理插件" aria-hidden="true"></span>

# 安装官方与自定义推理插件

超级管理员在可访问 Docker 的部署机上通过 `yoao plugins` 安装推理插件；平台 API 本身不访问 Docker socket，也不会自动发现容器。若只需要连接外部已部署好的 HTTP 推理服务，请返回 [模型服务注册](/user-guide/superadmin/ml-backend-registry)。

## 前置条件与环境隔离

- 非 root 的 Docker 管理员账号；托管容器沿用操作者的 UID/GID，每个安装使用独立的私有状态目录（权限 `0700`）。
- 显式非 `host` 的 Docker 网络与已加载的不可变 OCI 摘要镜像（`@sha256:...`）。
- GPU 插件另需 NVIDIA Container Toolkit、平台已配置的 `gpu_resource_id` 与物理 `physical_gpu_uuid`。
- 使用 Python 3.11+ 从可信 wheelhouse 或私有源安装 `yoao-sdk[plugins]`；部署 extra 不包含 Torch 或模型权重：

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --no-index --find-links /path/to/wheelhouse 'yoao-sdk[plugins]'
export YOAO_BASE_URL="https://platform.example"
export YOAO_API_KEY="<超级管理员 API 密钥>"
```

## 编写 `deployment.json`

以下是完整 `deployment.json` 结构示例（非可直接部署的真实制品）。将摘要、Ed25519 公钥、资源 ID、媒体主机与资产来源替换为经审核的真实值；`manifest` 以插件作者交付并经管理员审核的完整 manifest 为准。

```json
{
  "name": "LibreYOLO detection",
  "url": "http://172.17.0.1:18000",
  "manifest": {
    "plugin_id": "libreyolo",
    "version": "0.1.0",
    "publisher": "实际发布者",
    "license": "实际制品许可证",
    "artifact": "registry.example/libreyolo@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "sdk_compatibility": "0.1.0",
    "entrypoint": ["my-libreyolo-plugin", "serve", "--host", "0.0.0.0", "--port", "8000"],
    "capabilities": ["inference", "detection", "managed_models"],
    "models": [
      {
        "id": "detect",
        "task": "detect",
        "is_interactive": false,
        "supported_prompts": ["none"],
        "supported_inputs": ["full_image", "crop"],
        "supported_geometric_outputs": ["bbox"]
      }
    ],
    "pools": { "models": { "cap": 1 } },
    "resource": { "device": "cuda", "memory_mb": 16384, "gpu_memory_mb": 8192 },
    "asset_manifest_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "managed_model_compatibility": [
      {
        "framework": "libreyolo",
        "format": "libreyolo-native-state-dict-1.0",
        "runtime_device": "cuda"
      }
    ],
    "allowed_asset_sources": ["https://assets.example"]
  },
  "gpu_resource_id": "gpu-worker-1",
  "physical_gpu_uuid": "GPU-12345678-1234-1234-1234-123456789abc",
  "network": "aap-plugins",
  "host_port": 18000,
  "container_port": 8000,
  "cpus": 4,
  "gpu_verify_keyring": { "key-1": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
  "image_hosts": ["media.example"]
}
```

关键字段约束：

- `gpu_resource_id` 与 `physical_gpu_uuid` 对应平台逐卡资源；安装器仅将该卡挂载为容器内逻辑 `cuda:0`。
- `image_hosts` 为推理图片下载主机名白名单，`allowed_asset_sources` 为受控资产下载源 HTTP(S) origin 白名单。
- `gpu_verify_keyring` 为 `key_id -> unpadded base64url Ed25519 公钥` 映射，安装器将其写入并只读挂载到容器 `data/gpu-keyring.json`；禁止写入签发私钥。
- `models` 与 `pools` 必须与服务端 `/setup` 及健康挑战完全一致；多报或漏报会拒绝激活。
- 若支持加载自训 checkpoint，须声明 `managed_model_compatibility`（Ultralytics 原生权重使用 `"format": null`）。

| 运行配置 | 安装配置与证明 |
| --- | --- |
| CPU | `resource.device` 为 `cpu`，`gpu_memory_mb` 为 `0`；不配置 GPU 资源、UUID 或公钥，不提交 GPU 报告。安装器统一注入 `NVIDIA_VISIBLE_DEVICES=void` 与空的 `CUDA_VISIBLE_DEVICES`。 |
| CUDA | 显式绑定物理卡 UUID、显存预算与验签公钥；提交与镜像、资产、驱动及池拓扑一致的资格报告。 |

## 预留、资格核验与安装激活

```bash
yoao plugins inspect-image --image registry.example/libreyolo@sha256:... --json
yoao plugins prepare --config deployment.json --state-dir ./plugin-state --json
# 仅 LibreYOLO 等声明支持 prepare-assets 命令的镜像提供此步骤
yoao plugins prepare-assets --state-dir ./plugin-state --json
# 管理员审核与该安装身份、镜像和 GPU 绑定的资格报告后安装并激活
yoao plugins install --state-dir ./plugin-state --qualification gpu-report.json --yes --json
yoao plugins status --state-dir ./plugin-state --json
```

也可直接通过 `yoao plugins qualify --state-dir ./plugin-state --asset-dir ./assets --model-approval-ref ...` 或 `yoao plugins install --qualify` 在安装期调用镜像内置的资格检查逻辑。注意开发自测生成的 `yoao-plugin check --qualify-local` 报告不等于平台托管资格报告。

- **RapidOCR CPU 说明**：使用 `Dockerfile.cpu` 镜像，保持默认 `RAPIDOCR_POOL_CAP=3`，将 `container_port` 设为 `8005`，准备权重后直接执行 `yoao plugins install --state-dir ./rapidocr-state --yes --json`（不传 `--qualification`）。
- **重试与故障恢复**：若请求超时或中断，先用原状态目录执行 `yoao plugins status --state-dir ./plugin-state --json`，切勿另造状态目录或直接手删容器。
- **安装 API 与幂等性**：底层集合为 `/api/v1/admin/ml-integrations/plugins/installations`，生命周期变更需携带 `expected_revision`（安装 UUID 兼作重试幂等键）。

## 预训练资产测量与批准

安装激活与项目启用不会自动授权使用预训练权重。超级管理员须审核插件发布的 selection descriptor，创建 `choices.json`（含 `approved` 数组，每项为 `{"model_id": "...", "variants": {...}}`），然后提交测量批准：

```bash
yoao plugins asset-approvals --state-dir ./plugin-state --json
yoao plugins approve-assets --state-dir ./plugin-state --descriptor selections.json \
  --choices choices.json --expected-revision 0 --yes --json
```

`approve-assets` 在运行容器内执行固定 Python 标准库测量程序（要求镜像提供 `python3`，无需平台 SDK，也不初始化 CUDA），逐文件核验挂载目录 SHA-256 与字节大小并拒绝符号链接。文件变更或容器重启后均须重新测量并提交。

若历史 manifest 缺少 `models` 与 `pools` 声明，必须先完成[历史清单与本地收据迁移](./legacy-migration)。

## 停用、重启、升级与卸载

- 停用阻塞新请求，但 `disabled` 不等于 `safe_to_stop`。存在追踪作用域或未决显存租约时，须先安全排空并等待租约硬期限过期，否则 `disable` 会保留原状态并返回冲突。
- 保留同一安装身份并更换运行容器时，使用 `restart`；重启返回 `active` 后，须用原状态目录重新执行 `approve-assets`，并在服务池管理显式 `resume` 成员。

```bash
yoao plugins restart --state-dir ./plugin-state --yes --json
yoao plugins disable --state-dir ./plugin-state --yes --json
yoao plugins uninstall --state-dir ./plugin-state --yes --json
```

升级插件版本时，须在新状态目录中按新制品重新 `prepare` 并准备资产，再执行升级命令：

```bash
yoao plugins prepare --config new-deployment.json --state-dir ./new-state --json
yoao plugins upgrade --from-state ./plugin-state --state-dir ./new-state \
  --qualification new-report.json --yes --json
```

升级会创建新的安装记录与 Registry 身份；旧安装须在项目切换并满足依赖和排空条件后再卸载。

## 相关页面

- [历史清单与本地收据迁移](./legacy-migration)
- [模型服务注册（全局注册表）](/user-guide/superadmin/ml-backend-registry)
- [模型回流与默认预标](/user-guide/online-learning/models)
- [Inference runtime 与路由](/api/guides/inference-runtime)
