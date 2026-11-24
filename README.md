# YOAO Docs

YOAO 多模态 AI 辅助标注平台的官方文档站，基于 VitePress 构建，发布地址为 [https://yoao-labs.github.io/YOAO-Docs/](https://yoao-labs.github.io/YOAO-Docs/)。

## 本地预览与构建

构建期同步脚本（OpenAPI、CHANGELOG、快捷键、工作台设置、API 路由索引、环境变量与代码片段校验）会从主仓库 [YOAO-Labs/YOAO](https://github.com/YOAO-Labs/YOAO) 读取源文件。默认读取同级目录 `../YOAO`，也可通过 `YOAO_REPO_PATH` 指定路径。

```bash
pnpm install
YOAO_REPO_PATH=/path/to/YOAO pnpm dev
```

执行全量校验与构建：

```bash
YOAO_REPO_PATH=/path/to/YOAO pnpm check:all
DOCS_BASE=/YOAO-Docs/ YOAO_REPO_PATH=/path/to/YOAO pnpm build
```

## 跨仓库同步

主仓库 `YOAO-Labs/YOAO` 的 `main` 分支更新 OpenAPI 快照、工作台快捷键与设置、API 路由、`.env.example`、`CHANGELOG.md` 或示例后端后，会通过 `repository_dispatch`（`yoao-docs-sync`）触发本仓库同步与部署。架构决策（ADR）、计划文档与路线图保留在主仓库内，不在本站镜像发布。
