---
title: 注册与启用训练器插件
description: 使用 yoao plugins trainer CLI 与平台管理接口注册、核验资格、启用、停用和退役训练器插件
audience: [super_admin]
type: how-to
status: stable
last_reviewed: 2026-11-27
---

# 注册与启用训练器插件

在线学习训练由平台 `training-supervisor`（`apps/training-executor`）调度独立训练器插件执行。无论是官方插件（`yoao.trainer.ultralytics`、`yoao.trainer.libreyolo`）还是自研插件，均须遵循「注册 → 资格核验 → 启用」三步准入流程后，项目才可选择对应训练器与模型目录。

## 准入前检查清单

- 已通过 [CLI 检查与镜像打包](../sdk/cli-and-packaging) 完成 `yoao-plugin validate` 与 `yoao-plugin trainer check`。
- 已导出 `yoao-extension-manifest/v1` 清单文件与插件 `describe` 生成的 `TrainerCapabilitiesV1` JSON。
- 容器运行模式下，制品须为不可变 `@sha256:...` 镜像摘要；节点只读资产目录已准备好与 `manifest` / `architectures` 匹配的预训练基础权重（SHA-256 严格一致）。

## CLI 操作步骤

### 1. 注册训练器插件

```bash
yoao plugins trainer register \
  --manifest ./manifest.json \
  --capabilities ./capabilities.json \
  --execution-mode container \
  --source-tier official \
  --json
```

- `--execution-mode` 可选 `container`（生产推荐，绑定不可变 `@sha256:...`）或 `local_process`（`artifact` 必须为空）。
- 注册成功后状态为 `registered`，此时不能接收训练任务。

### 2. 提交资格核验报告

```bash
yoao plugins trainer qualify yoao.trainer.ultralytics \
  --expected-revision 1 \
  --report ./trainer-qualification-report.json \
  --json
```

平台校验资格报告与镜像、驱动及 `capabilities_digest` 一致后，插件状态流转为 `qualified`。可选 `--report-sha256` 显式锁定报告摘要。

### 3. 启用、停用与退役

```bash
# 查看当前清单与修订号
yoao plugins trainer list --json
yoao plugins trainer get yoao.trainer.ultralytics --json

# 启用插件（同一 framework_id 下仅允许一个处于 enabled 状态的插件）
yoao plugins trainer enable yoao.trainer.ultralytics --expected-revision 2 --yes --json

# 停用插件（阻止新实验入队，不影响历史实验与已注册模型）
yoao plugins trainer disable yoao.trainer.ultralytics --expected-revision 3 --yes --json

# 永久退役已停用的插件（不可逆，保留历史血缘与审计）
yoao plugins trainer retire yoao.trainer.ultralytics --expected-revision 4 --yes --json
```

所有变更动作均采用基于 `expected_revision` 的乐观并发控制（CAS），并记录审计日志；若返回修订冲突，先执行 `yoao plugins trainer get` 获取最新修订号后重试。

## 对应 HTTP 管理接口

基路径为 `/api/v1/admin/trainer-plugins`（对应 `yoao-sdk` 方法 `client.trainer_plugins`），仅限超级管理员访问：

| 方法与路径 | 对应 CLI | 说明 |
| --- | --- | --- |
| `GET /` | `trainer list` | 按可选 `status`、`execution_mode` 列出训练器插件及 `capabilities_digest` |
| `POST /` | `trainer register` | 注册清单与能力快照，返回 `201` |
| `GET /{plugin_id}` | `trainer get` | 读取插件详情、能力快照与资格状态 |
| `POST /{plugin_id}/qualify` | `trainer qualify` | 提交并校验资格报告 |
| `POST /{plugin_id}/enable` | `trainer enable` | 启用已核验插件（未核验返回 `422`） |
| `POST /{plugin_id}/disable` | `trainer disable` | 停用插件，阻断新训练任务准入 |
| `POST /{plugin_id}/retire` | `trainer retire` | 永久退役处于 `disabled` 状态的插件 |

## 相关页面

- [开发自定义训练器插件](../sdk/trainer-quickstart)
- [Trainer Protocol v1](../protocols/trainer-v1)
- [官方 Ultralytics 训练器插件](../official/trainer/ultralytics) · [官方 LibreYOLO 训练器插件](../official/trainer/libreyolo)
