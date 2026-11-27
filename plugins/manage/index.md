---
title: 安装与运行管理
description: YOAO 管理员如何安装推理插件、注册启用训练器、核验资产及迁移历史收据
audience: [super_admin, project_admin]
type: how-to
status: stable
last_reviewed: 2026-11-27
---

# 安装与运行管理

YOAO 对所有扩展点强制执行「发现不等于资格」：管理员显式注册不可变制品（`@sha256:...`）、绑定资源配额并提交资格核验或资产测量结果，平台才会开放接流或调度训练。

<div class="doc-card-grid">
  <DocLinkCard title="安装推理插件" desc="yoao plugins install / qualify / approve-assets / upgrade 全流程" href="/plugins/manage/inference-install" />
  <DocLinkCard title="注册训练器插件" desc="yoao plugins trainer 与 /api/v1/admin/trainer-plugins 生命周期管理" href="/plugins/manage/trainer-install" />
  <DocLinkCard title="历史清单与收据迁移" desc="alembic plugin_capabilities_inventory 与 yoao plugins migrate-state" href="/plugins/manage/legacy-migration" />
</div>

## 按扩展点选择管理路径

| 扩展点 | 安装与生命周期入口 | 说明 |
| --- | --- | --- |
| `inference`（容器安装） | `yoao plugins prepare` / `install` / `approve-assets` / `disable` / `restart` / `upgrade` | 平台不直接访问 Docker socket；由管理员在部署机安装受管容器并提交收据，见[安装官方与自定义推理插件](./inference-install) |
| `inference`（直连 HTTP） | 控制台「模型市场 → 注册管理」或 `yoao plugins register-direct` | 适用于外部已有 HTTP 服务，详见[模型服务注册](/user-guide/superadmin/ml-backend-registry) |
| `trainer` | `yoao plugins trainer {register,qualify,enable,disable,retire}` | 同 `framework_id` 仅允许单个活跃插件，见[注册与启用训练器插件](./trainer-install) |
| `notification_channel` | `/api/v1/admin/notification-channels` | 登记通道 URL、Bearer 密钥与收件人 `address_schema` 验证，参考[飞书私信插件](../official/notification-channel/feishu-dm) |
| `format_adapter` | `/api/v1/admin/format-adapters` | 登记解析与导出 HTTP 端点、Bearer 密钥与支持媒体类型，参考[LabelMe JSON 插件](../official/format-adapter/labelme-json) |

## 安装工具环境准备

平台安装器由 Core 仓库 SDK 提供（`yoao-sdk[plugins]`），不依赖于插件作者使用的 `yoao-plugin-sdk`，也不需要安装 FastAPI、PyTorch 或模型框架。详细 CLI 参数参考见 [CLI 参考（yoao plugins）](/sdk/cli#yoao-plugins)。
