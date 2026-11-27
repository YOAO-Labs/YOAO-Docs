---
title: 历史清单与本地收据迁移
description: 在数据库升级前审批 plugin_capabilities_inventory，并使用 yoao plugins migrate-state 迁移旧版本地插件状态目录
audience: [super_admin, ops]
type: how-to
status: stable
last_reviewed: 2026-11-27
---

<span id="历史清单与本地收据迁移" aria-hidden="true"></span>

# 历史清单与本地收据迁移

早期版本的插件 manifest 未包含完整的获准模型能力列表（`models`）与服务池容量（`pools`）。平台禁止按插件名称或默认规则自动推测这些能力；升级迁移 `bo0401` 要求管理员逐项核对不可变镜像并显式批准能力清单，否则数据库升级将整次拒绝。

## 执行步骤

1. **停机与备份**：在维护窗口停止旧版 API、Inference owner 与相关 worker，保留数据库以及所有私有安装状态目录的受控备份；为仍依赖旧镜像的任务规划恢复或退役路径。
2. **编写审批清单 `inventory.json`**：准备绝对路径 JSON 文件，顶层格式为 `{"schema": 1, "installations": [...]}`。每条记录须完整包含以下字段，且 UUID、原 manifest、OCI 制品、资产摘要及运行镜像 ID 必须与库中历史记录精确一致：
   - `installation_id`、`registry_id`、`artifact`、`image_id`
   - 完整 `old_manifest` 与 `old_manifest_sha256`
   - `asset_manifest_sha256`
   - 经管理员核准的 `models`、`pools` 与可追溯审批单号 `approval_ref`
3. **计算旧 manifest 摘要并执行数据库迁移**：`old_manifest_sha256` 须按标准化 ASCII JSON 字节计算：

```python
import hashlib, json
digest = hashlib.sha256(
    json.dumps(old_manifest, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False).encode("ascii")
).hexdigest()
```

随后通过部署环境的标准 Alembic 入口传入绝对路径（若当前库无历史插件安装记录，无需伪造 `inventory.json`）：

```bash
alembic -x plugin_capabilities_inventory=/absolute/path/inventory.json upgrade head
```

4. **迁移本地私有状态目录**：数据库迁移完成后，对部署机上的每个私有安装状态目录执行 `migrate-state`：

```bash
yoao plugins migrate-state \
  --state-dir ./plugin-state \
  --manifest approved-manifest.json \
  --image-id sha256:<已核验镜像ID> \
  --yes --json
```

该命令重新核验平台权威 Registry、镜像摘要及当前容器/启动身份，只更新获准能力投影；它不会更改 Docker 所有权标签、GPU 资源绑定或数据目录，并在同一私有收据文件内保留不含 Token 的旧状态快照（不生成第二份永久凭据）。

## 迁移边界说明

- **数据库降级限制**：若迁移后已经新增、删除或修改过安装记录，直接降级迁移会被拒绝，不能强行丢弃记录。
- **收据迁移不授予新版本资格**：缺少当前运行声明的旧不可变镜像仍可按原身份完成安全停用与退役，但在激活或重建进程前仍须满足当前声明与资格门禁。
- **旧 CPU 环境文件处理**：状态目录下若留有未限制 GPU 可见性的历史环境文件，状态查询与按原身份排空不会改动它；重新创建进程时会拒绝配置不一致，请退役后使用新状态目录重新部署。

## 相关页面

- [安装官方与自定义推理插件](./inference-install)
- [平台升级与迁移指南](/ops/upgrade-guide)
