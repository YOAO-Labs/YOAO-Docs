# YOAO Docs

YOAO 多模态 AI 辅助标注平台的官方文档站，基于 VitePress 构建，发布地址为 [https://yoao-labs.github.io/YOAO-Docs/](https://yoao-labs.github.io/YOAO-Docs/)。

## 三仓库协同结构

站点内容与自动化脚本协同聚合来自三个上游仓库的事实源：

| 仓库 | 环境变量 | 同步产物 |
| --- | --- | --- |
| [YOAO](https://github.com/YOAO-Labs/YOAO) | `YOAO_REPO_PATH`（默认同级 `../YOAO`） | OpenAPI 快照、CHANGELOG、快捷键、工作台设置、路由索引、环境变量、Echo 代码片段 |
| [YOAO-Plugins](https://github.com/YOAO-Labs/YOAO-Plugins) | `YOAO_PLUGINS_REPO_PATH`（默认 `../YOAO-Plugins`） | 官方 10 个插件目录、Ultralytics / LibreYOLO 训练器参数参考表 |
| [Plugin-SDK](https://github.com/YOAO-Labs/Plugin-SDK) | `YOAO_PLUGIN_SDK_REPO_PATH`（默认 `../Plugin-SDK`） | `yoao-plugin-sdk`（Python）与 `@yoao/plugin-sdk`（JS/TS）版本、extra 与导出清单 |

## 本地预览与构建

```bash
pnpm install
YOAO_REPO_PATH=/path/to/YOAO pnpm dev
```

执行完整文档生成、校验与生产构建（需 Python >=3.10 与 `pydantic>=2.5` 以运行训练参考生成脚本）：

```bash
YOAO_REPO_PATH=/path/to/YOAO \
YOAO_PLUGINS_REPO_PATH=/path/to/YOAO-Plugins \
YOAO_PLUGIN_SDK_REPO_PATH=/path/to/Plugin-SDK \
bash -c '
  pnpm gen &&
  pnpm gen:env-vars &&
  pnpm gen:plugins &&
  pnpm gen:training &&
  pnpm check:all &&
  pnpm check:plugins-codegen &&
  pnpm check:training &&
  DOCS_BASE=/YOAO-Docs/ pnpm build
'
```

## 跨仓库同步

三个上游仓库更新后，通过 `repository_dispatch`（`yoao-docs-sync`、`yoao-plugins-docs-sync`、`plugin-sdk-docs-sync`）触发 `.github/workflows/docs-sync.yml` 自动刷新受跟踪生成文件并部署 GitHub Pages。
