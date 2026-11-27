---
title: 文档产物与真值边界
audience: [dev]
type: reference
status: stable
last_reviewed: 2026-11-27
---

# 文档产物与真值边界

文档站包含手写正文、从三仓真值源生成的受跟踪文件、仅在构建期生成的公共产物，以及图片和示例源码。维护时先确认真值源所在仓库，再决定编辑位置与同步命令；不要手改自动生成段落。

## 产物总表

| 类型            | 站点路径或产物                                                                                                                     | 真值源                                                                                                         | 生成或同步方式                                                                                     | Git 跟踪           | 发布触发                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| 手写正文        | `index.md`、`user-guide/**`、`plugins/**`、`sdk/**`、`api/**`、`dev/**`、`ops/**` 中非生成 Markdown                               | 文件本身                                                                                                       | 无，直接编辑                                                                                       | 是                 | `YOAO-Docs` 推送 `main`                                                   |
| 手写公共资源    | `public/api-reference.html`                                                                                                        | 文件本身                                                                                                       | 无，直接编辑                                                                                       | 是                 | `YOAO-Docs` 推送 `main`                                                   |
| 受跟踪生成页    | `user-guide/workbench/hotkeys.generated.md`                                                                                        | `YOAO/apps/web/src/pages/Workbench/state/hotkeys.ts`                                                           | `scripts/generate-hotkeys.mjs`（`pnpm gen` 或 `predev` / `prebuild` 自动刷新）                     | 是，生成后需提交   | `YOAO` 变更经 `docs-sync.yml` 同步，或连同 `YOAO-Docs` 提交               |
| 受跟踪生成页    | `user-guide/workbench/settings.generated.md`                                                                                       | `YOAO/apps/web/src/pages/Workbench/state/{workbenchSettingsFields,workbenchLocalDefaults}.ts` 与 `api/auth.ts` | `scripts/generate-settings.mjs`（`pnpm gen:settings`；`check:codegen` 只读比对）                   | 是，生成后需提交   | `YOAO` 变更经 `docs-sync.yml` 同步，或连同 `YOAO-Docs` 提交               |
| 受跟踪生成页    | `api/guides/_routes.generated.md`                                                                                                  | `YOAO/apps/api/app/api/v1/**` 路由声明                                                                         | `scripts/generate-api-index.mjs`（`pnpm gen`；`check:codegen` 只读比对）                           | 是，生成后需提交   | `YOAO` 变更经 `docs-sync.yml` 同步，或连同 `YOAO-Docs` 提交               |
| 受跟踪生成页    | `dev/reference/env-vars.md`                                                                                                        | `YOAO/.env.example` 变量与注释                                                                                 | `scripts/generate-env-vars.mjs`（`pnpm gen:env-vars`）                                             | 是，生成后需提交   | `YOAO` 变更经 `docs-sync.yml` 同步，或连同 `YOAO-Docs` 提交               |
| 受跟踪生成区块  | `plugins/official/trainer/{ultralytics,libreyolo}.md` 中的参数表、`plugins/official/index.md` 与 `plugins/sdk/{python,javascript}.md` | `YOAO` 训练契约、`YOAO-Plugins` manifest、`Plugin-SDK` 包清单                                                  | `scripts/generate-training-reference.py`、`generate-plugin-catalog.mjs`、`generate-plugin-sdk-reference.mjs` | 是，生成后需提交 | 三仓推送后由 `docs-sync.yml` 刷新或本地执行生成脚本                       |
| 构建期镜像      | `changelog/**`                                                                                                                     | `YOAO/CHANGELOG.md` 与 `YOAO/docs/changelogs/**`                                                               | `scripts/mirror-changelog.mjs`（`predev` / `prebuild` 自动重建）                                   | 否，已忽略         | 构建时拉取 `YOAO` 最新提交生成                                            |
| 构建期公共文件  | `public/openapi.json`                                                                                                              | `YOAO/apps/api/openapi.snapshot.json`                                                                          | `scripts/sync-openapi.mjs`（`predev` / `prebuild` 自动复制）                                       | 否，已忽略         | 构建时从 `YOAO` 复制                                                      |
| 构建期公共文件  | `public/llms.txt`、`public/llms-full.txt`                                                                                          | 当前可发布 Markdown 正文                                                                                       | `scripts/generate-llms.mjs`（`postbuild` 或 `pnpm gen:llms` 生成）                                 | 否，已忽略         | 每次 `pnpm build` 自动生成                                                |
| 示例源码        | `dev/examples/**`                                                                                                                  | `YOAO/examples/**` 或本地示例目录                                                                              | 作为代码片段参照或静态示例维护，不作为正文页面发布                                                 | 是                 | `YOAO-Docs` 推送 `main`                                                   |
| 用户手册配图    | `user-guide/images/**`（含 GIF）                                                                                                   | 已发布文件及其正文引用                                                                                         | [按需更新指定素材](../how-to/update-screenshots)，不随构建生成                                     | 是，核对后提交     | `YOAO-Docs` 推送 `main`                                                   |
| 用户手册视频    | `public/media/**` 中的视频与 WebP 封面                                                                                             | 已发布文件及 `<DocsVideo>` 引用                                                                                | 按需更新指定素材，保留封面及文字说明                                                               | 是，核对后提交     | `YOAO-Docs` 推送 `main`                                                   |
| 首页演示媒体    | `public/home/**` 中的视频与封面；`.vitepress/theme/assets/home/hero/**` 中的静态图                                                 | 已发布文件及主题组件引用                                                                                       | 按需更新；静态卡片可用 `pnpm media:home-hero` 从核对源图转换 WebP                                  | 是，核对后提交     | `YOAO-Docs` 推送 `main`                                                   |
| 可编辑文档图    | `public/diagrams/**`                                                                                                               | 内嵌 Excalidraw scene 与 Virgil 字体的 SVG 文件本身                                                            | 使用 Excalidraw 重新导入和导出；`pnpm check:diagrams` 校验合同                                     | 是                 | `YOAO-Docs` 推送 `main`                                                   |
| 维护材料        | `maintainers/image-checklist.md`                                                                                                   | 历史编辑备注与素材索引                                                                                         | 不作为采集清单或发布门禁                                                                           | 是，但不发布为页面 | 提交到 `YOAO-Docs`，文件本身通过 `srcExclude` 排除发布                    |

## 维护规则

1. 手写正文直接修改 canonical 页面；同一主题不要在多个目录维护重复说明，跨栏目入口通过链接指向权威页。
2. 受跟踪生成页和生成区块必须从对应仓库真值源重新生成后提交。手工修改标记区块会在下次生成时被覆盖；`pnpm check:codegen` 与 `pnpm check:plugins-codegen` 会只读比对一致性。
3. `changelog/` 为构建期镜像目录，真值源在 `YOAO` 主仓；`public/openapi.json`、`llms.txt` 和 `llms-full.txt` 为构建输出，均不纳入 Git 跟踪。
4. 示例源码、历史重定向（`redirects/**`）与维护清单不作为普通知识库页面维护，各自按约定排除在导览/Frontmatter 门禁之外。
5. 已发布媒体以实际文件和引用为准，不随产品测试、文档构建或发布检查重新采集。只复核本次更新的媒体。
6. Excalidraw 图表不属于用户手册截图。使用 `<ExcalidrawDiagram>` 引用，并以内嵌 scene 的单个 SVG 作为唯一真值。

## 常用同步命令

```bash
YOAO_REPO_PATH=/path/to/YOAO pnpm gen
YOAO_REPO_PATH=/path/to/YOAO pnpm gen:env-vars
YOAO_PLUGINS_REPO_PATH=/path/to/YOAO-Plugins YOAO_PLUGIN_SDK_REPO_PATH=/path/to/Plugin-SDK pnpm gen:plugins
pnpm check:all
DOCS_BASE=/YOAO-Docs/ pnpm build
```

`pnpm build` 会在 `prebuild` 与 `postbuild` 阶段自动物化镜像和公共构建产物。提交前确认仅暂存应当受 Git 跟踪的文件。
