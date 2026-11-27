---
title: JavaScript / TypeScript SDK（@yoao/plugin-sdk）
description: 零运行时依赖的 Node.js >=20 插件 SDK，提供清单校验、声明式主题 Token 校验与 Trainer 契约验证
audience: [dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# JavaScript / TypeScript SDK（`@yoao/plugin-sdk`）

`@yoao/plugin-sdk`（源码位于 `Plugin-SDK/packages/js/`）是零第三方运行时依赖的 Node.js（`>=20`）ESM 与 TypeScript 类型声明包，覆盖清单元校验、声明式 `--sc-*` 主题验证、训练器协议验证与 Bearer 鉴权辅助。

<!-- plugin-sdk-js:start -->

## 包信息与导出符号

- **包名**：`@yoao/plugin-sdk`（当前版本 `0.1.0`，Node.js `>=20.0.0`，License：MIT）
- **包类型**：零运行时依赖纯 ESM + `.d.ts`
- **CLI 命令**：`yoao-plugin-js`（`./src/cli.mjs`，子命令：`validate`、`validate-theme`）

| 分类 | 导出符号 | 说明 |
| --- | --- | --- |
| 清单与推理常量 | `EXTENSION_MANIFEST_SCHEMA`, `INFERENCE_CAPABILITIES`, `INFERENCE_EXECUTION_MODES`, `INFERENCE_PROTOCOL_VERSION`, `INFERENCE_TASK_VALUES`, `INFERENCE_WIRE_PROTOCOL_VERSION`, `validateManifest` | 校验 `yoao-extension-manifest/v1` 五类扩展点清单（含推理 `container`/`direct` 模式） |
| 声明式主题 | `validateThemeTokens` | 校验 `light`/`dark` 下 `--sc-*` 语义 CSS Token，阻止注入构造 |
| 鉴权辅助 | `readSecret`, `verifyBearerToken` | 只读凭据及 `*_FILE` 读取，基于 `crypto.timingSafeEqual` 的恒定时间鉴权 |
| 训练器协议校验 | `PREVIEW_MAX_EDGE`, `PREVIEW_MAX_OUTPUTS`, `PREVIEW_MAX_OUTPUT_BOXES`, `PREVIEW_MAX_OUTPUT_BYTES`, `PREVIEW_MAX_POOL_BOXES`, `PREVIEW_MAX_POOL_BYTES`, `PREVIEW_MAX_POOL_PIXELS`, `PREVIEW_MAX_SOURCES`, `PREVIEW_MAX_SOURCE_BOXES`, `PREVIEW_MAX_SOURCE_BYTES`, `PREVIEW_MAX_SOURCE_PIXELS`, `PREVIEW_SEED_MAX`, `SHA256_PATTERN`, `TRAINER_PROTOCOL_VERSION`, `canonicalJsonDigest`, `validateConfigResult`, `validatePreviewReport`, `validatePreviewSpec`, `validateServingCompatibility`, `validateTrainEvent`, `validateTrainReceipt`, `validateTrainSpec`, `validateTrainerCapabilities` | 对应 `yoao-trainer/v1` 的静态/运行时契约校验 |

<!-- plugin-sdk-js:end -->

## 导入与使用示例

```js
import { validateManifest, validateThemeTokens } from "@yoao/plugin-sdk";

const manifest = validateManifest({
  manifest_schema: "yoao-extension-manifest/v1",
  extension_point: "theme",
  plugin_id: "custom.theme.midnight",
  version: "0.1.0",
  publisher: "Custom Publisher",
  license: "MIT",
  protocol_version: "yoao-theme/v1",
  capabilities: ["dark"],
  extension: { theme_id: "midnight", tokens_file: "tokens.json" },
});

const tokens = validateThemeTokens({
  dark: { "--sc-bg": "#0b1120", "--sc-fg": "#f8fafc" },
});
```

## 主题 Token 安全约束

`validateThemeTokens` 强制仅允许以 `--sc-` 开头的 CSS 变量，每个模式定义 1 至 256 项，值长度不超过 128 字符，允许颜色字面量（hex、`rgb`/`rgba`/`hsl`/`hsla`/`oklch`）或常规尺寸（`px`/`rem`/`em`/`%`/`0`），显式拒绝 `url(`、`expression(`、`javascript:`、`@import`、`;`、`{`、`}`、`<`、`>`。

## 命令行与测试

```sh
# 使用 CLI 校验清单或主题 Token 文件
yoao-plugin-js validate ./manifest.json
yoao-plugin-js validate-theme ./tokens.json

# 在 Plugin-SDK/packages/js 目录运行原生测试
node --test test/sdk.test.mjs
```

## 相关页面

- [Extension Manifest v1](../protocols/extension-manifest)
- [通知渠道、格式与主题规范](../protocols/notification-format-theme)
- [CLI 检查与镜像打包](./cli-and-packaging)
