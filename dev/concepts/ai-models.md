---
audience: [dev]
type: explanation
status: stable
last_reviewed: 2026-11-27
---

# AI 模型集成

平台核心不再内置 PyTorch 或模型推理源码；所有推理与训练实现均在独立仓库 [YOAO-Plugins](https://github.com/YOAO-Labs/YOAO-Plugins) 维护。协议契约见 [Inference Protocol v2](/plugins/protocols/inference-v2)，具体插件规格与部署文档见 [官方插件目录](/plugins/official/)。

服务实例、模型、服务池与项目发布之间的关系，以及请求如何选路、Token 如何认证，见[模型服务接入、路由与认证](./ml-backend-routing-and-auth)。

系统托管认证以固定服务 ID 和部署指定的可信地址绑定，registry 的 `managed:<provider>` 与凭据一起参与认证修订围栏。API 只向对应地址发送该服务的凭据，禁用环境代理与重定向；业务 Bearer 与 GPU 控制签名独立校验，普通健康检查保持公开。

---

## 0. 官方推理插件目录 {#0-backend-名录}

六个官方推理插件各维持独立的 Python/PyTorch/ONNX 运行环境与默认端口；详细模型目录、预训练清单与环境变量已迁移至各自插件文档：

| 插件 | 默认端口 | Compose profile | 核心任务与特性 | 插件文档 |
| --- | --- | --- | --- | --- |
| `grounded-sam2` | `8001` | `gpu` | 开放词汇检测、交互式图像分割与视频跟踪 | [Grounded-SAM2](/plugins/official/inference/grounded-sam2) |
| `sam3` | `8002` | `gpu-sam3` | PCS 检测分割、交互分割与 PVS 视频跟踪 | [SAM3](/plugins/official/inference/sam3) |
| `yolo` | `8003` | `gpu-yolo` | Ultralytics 8.4 多任务推理与自训模型回流 | [Ultralytics YOLO](/plugins/official/inference/yolo) |
| `onnxtools` | `8004` | `gpu-onnxtools` | 两阶段车辆检测与 13+11 属性分类（atom/composite） | [ONNXTools](/plugins/official/inference/onnxtools) |
| `rapidocr` | `8005` | `gpu-rapidocr` | PP-OCRv5/v6 原子检测/方向校正与识别（atom/composite） | [RapidOCR](/plugins/official/inference/rapidocr) |
| `libreyolo` | `8000` | 插件安装 | 原生 YOLOv9 检测与 `libreyolo` 自训模型回流 | [LibreYOLO](/plugins/official/inference/libreyolo) |

## 1. 平台侧集成架构

### 1.1 进程隔离与镜像消费边界

- **跨服务 ABI 隔离**：Grounded-SAM2（Python 3.10 / CUDA 12.1）与 SAM3（Python 3.12 / CUDA 12.8）使用各自固定的底层库与子模块，必须作为独立进程部署，严禁合并 Python 环境。
- **Compose 与插件安装共存**：平台提供 `docker-compose.ml.yml` 叠加文件与受管插件 CLI 安装（`yoao plugins`）两种模式；前者由 `docker-compose.ml-<provider>.yml` 启用，后者由管理员审批 `@sha256:...` 镜像摘要与物理卡资源（见[安装官方与自定义推理插件](/plugins/manage/inference-install)）。
- **推理请求与 `/setup` 消费**：平台核心通过 `POST /predict` 派发推理，经 `/setup` 读取模型目录、变体轴、交互能力与 `output_attribute_schema`。后端内部端点 `/cache/stats` 与 `/metrics` 不进入平台 API 契约。

### 1.2 单实例并存与双 LRU 池原则

单容器内图像与视频模型分别驻留于独立容量的 LRU 池并共享冷构建锁。受管 GPU 卸载须同时清空图像池、视频池及 Embedding 缓存，当且仅当 builder、borrower 与 GPU 常驻对象全部归零时，才可在显存账本核减占用。

---

Grounded-SAM2 与 SAM3 的模型目录均为 `/app/checkpoints`，由各自持久卷提供。管理员按插件随版本发布的资产清单核验大小、SHA256、来源和许可证；启动不下载权重、不接受 gated 许可，也不向插件提供 S3 管理凭据。图片、PVS 和 multiplex 需要的文件分别准备，目录可见或健康检查通过不代表已获准使用。

---

## 2. 三种 prompt 路由

```
context.type == "point"  ┐
context.type == "bbox"   ├─▶ SAM 2.1 image_predictor → mask → polygon
context.type == "text"   ┘   先 GroundingDINO(caption→boxes)，再 SAM
```

返回值统一是 `polygonlabels` 数组（归一化 [0,1] 顶点列表 + score）。`text` 一次可能返回 N 个 polygon（DINO 召回多目标）。

---

## 3. SAM 2 image embedding 缓存

### 3.1 为什么缓存

工作台 `S` 工具的典型操作是同一张图反复点击 / 拖框（先 positive point 再 negative point 修边、调 bbox 看效果）。每次 SAM 2 `set_image()` 计算 image embedding ≈ 1.5 s（4060 / tiny），是热点。

DINO 端不缓存：每条 caption 不同，命中率低，且 DINO 输出是 box 不是 embedding。

### 3.2 Cache key

```
cache_key = sha1(url_path + "|" + sam_variant)
```

- `url_path` 由 `urllib.parse.urlsplit()` 取 `scheme://netloc/path`，**剥掉 query string**。MinIO presigned URL 的 `X-Amz-Signature` / `X-Amz-Date` 每次都会变，但底层对象不变；剥掉签名后跨 TTL 仍然命中。
- 拼上 `sam_variant`（`tiny` / `small` / `base_plus` / `large`）确保切大模型不会读到老 embedding。
- 本地路径（dev 用）直接以原串作 key。

### 3.3 命中后做什么

SAM2ImagePredictor `set_image()` 之后状态写在 `_features` / `_orig_hw` / `_is_image_set` / `_is_batch` 几个实例属性。命中时把这些字段从 `CacheEntry` 写回，等价于 `set_image()` 但跳过 image encoder。

| prompt  | 命中能省                             | 命中不能省                                                  |
| ------- | ------------------------------------ | ----------------------------------------------------------- |
| `point` | `_fetch_image()` + SAM `set_image()` | SAM `predict()`（每次 prompt 不同）                         |
| `bbox`  | `_fetch_image()` + SAM `set_image()` | SAM `predict()`                                             |
| `text`  | SAM `set_image()`                    | DINO 推理（每次 caption 不同） + image fetch（DINO 要原图） |

> 工程注意：`features` 里的 tensor 在 GPU。我们存引用、不 deepcopy；GPU 内存上限由 LRU 容量物理保证。

### 3.4 容量与显存预算

| 变体        | 单条 embedding ≈ | 默认 capacity | 总占用 ≈ |
| ----------- | ---------------- | ------------- | -------- |
| `tiny`      | 4 MB             | 16            | 64 MB    |
| `small`     | 8 MB             | 16            | 128 MB   |
| `base_plus` | 16 MB            | 16            | 256 MB   |
| `large`     | 24 MB            | 8             | 192 MB   |

经验值，仅供参考。`EMBEDDING_CACHE_SIZE` 环境变量可调：

- 4060 8 GB → 16
- 3090 24 GB → 32
- A100 40 GB → 64

> ⚠️ `large` 变体下不要把 cache size 设到 64+：单次能吃 ~1.5 GB，叠加 SAM/DINO 模型本体 + 推理临时显存可能 OOM。

### 3.5 vendor 升级风险

`_features` / `_orig_hw` / `_is_image_set` / `_is_batch` 是 `IDEA-Research/Grounded-SAM-2` 的内部 API。vendor 由父仓库 gitlink 固定提交，首次 checkout 执行 `git submodule update --init --recursive`；升级时显式切换并审查目标提交，不使用 `--remote` 自动追踪上游。升级 Grounded-SAM-2 或 SAM3 后必须运行 5-clicks 集成验收（对应后端 README 的性能参考），SAM3 还须核对请求级 autocast 补丁能否在干净上游源码中应用。许可及上游来源随子模块保留。

---

## 4. 观测

### 4.1 端点

- `GET /metrics` — Prometheus exposition（`generate_latest()` 原始格式）。
- `GET /cache/stats` — 人类可读 JSON：`{size, capacity, hits, misses, hit_rate, variant}`。

### 4.2 指标

| metric                         | 类型      | labels                 | 含义                                              |
| ------------------------------ | --------- | ---------------------- | ------------------------------------------------- |
| `embedding_cache_hits_total`   | Counter   | `prompt_type`          | 命中次数（按 `point`/`bbox`/`text`/`unknown` 分） |
| `embedding_cache_misses_total` | Counter   | `prompt_type`          | 未命中次数                                        |
| `embedding_cache_size`         | Gauge     | —                      | 当前缓存条目数                                    |
| `inference_latency_seconds`    | Histogram | `prompt_type`, `cache` | 端到端 `/predict` 延迟，`cache ∈ {hit,miss}`      |

bucket：`[0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]`，专为「miss 长尾秒级 + hit 短尾毫秒级」打的两段。

### 4.3 Prometheus scrape

本 backend 默认监听 8001。在 monitoring profile 的 prometheus 配置里增加 job：

```yaml
scrape_configs:
  - job_name: grounded-sam2-backend
    metrics_path: /metrics
    static_configs:
      - targets: ["grounded-sam2-backend:8001"]
```

### 4.4 关键查询

```text
# embedding 缓存命中率（按 prompt 类型）
sum by (prompt_type) (rate(embedding_cache_hits_total[5m]))
  / (
    sum by (prompt_type) (rate(embedding_cache_hits_total[5m]))
    + sum by (prompt_type) (rate(embedding_cache_misses_total[5m]))
  )

# /predict 命中 vs 未命中 P95 延迟
histogram_quantile(0.95,
  sum by (le, cache) (rate(inference_latency_seconds_bucket[5m]))
)
```

期望：交互式工作台流量稳定后，`prompt_type=point` 的命中率应 ≥ 70%（同图多次点击的天然分布）。

---

## 4.5 per-backend max_concurrency 限速

`ml_backend_registry.extra_params.max_concurrency`（JSONB 字段，默认 4）控制平台到该 backend 的并发 `/predict` 上限。实现：

- `apps/api/app/services/ml_client.py` 把 backend id → semaphore 的缓存挂在当前 event loop 自身；loop 退出后缓存与已绑定 semaphore 作为同一循环对象图一起回收，不会被模块级容器反向保活，也不会交给后续 `asyncio.run()`。
- `MLBackendClient.__init__` 读取 `extra_params.max_concurrency`；真正进入预测时，`_get_semaphore(backend_id, max_cc)` 在当前 event loop 中取得或创建信号量。
- `predict()` / `predict_interactive()` 在 `async with await self._acquire():` 内调 httpx，信号量 acquire/release 自动绕在请求 IO 外。
- 同一 event loop 内的多个 `MLBackendClient` 实例共享同 backend id 的信号量，跨 task / 跨请求生效；API 与不同 Celery loop 之间仍不共享，本地闸不能替代 Redis 全局 lease。

当 `ML_BACKEND_ROUTER_MODE=enforce` 时，服务池路由 ledger 会在选定物理实例前按同一 `max_concurrency` 发放 Redis route lease，因此 API 与多个 Celery worker 共享实例级上限；off/observe 仍只依赖各进程本地 semaphore。GPU 仲裁的逐资源 effective mode 负责显存准入与驱逐，不决定 route lease 是否生效。

**配置示例**（DB JSONB）：

```json
// ml_backend_registry 行
{
  "id": "abc-...",
  "url": "http://172.17.0.1:8001/",
  "extra_params": {
    "max_concurrency": 2
  }
}
```

**调整后必须重启 worker**：每个存活 event loop 仍按 backend id 缓存既有信号量，改字段后须 `docker compose restart api celery-worker` 才能生效。若要运行期热更新，需要把 cache key 纳入 `max_cc` 或增加 invalidation 机制。

**注册表单 UI**：全局注册表单 `GlobalBackendFormModal`（模型市场 → 注册管理，仅超管）在「认证方式」下方提供「最大并发」number input（1-32，留空走默认 4），提交时合并到 `extra_params.max_concurrency`（覆盖 textarea JSON 同名键）。`RegisteredBackendsTab` 全局注册表行的类型列旁显示 `≤N 并发` chip，缺省值不渲染避免列表噪音——限速真正 per-物理-backend 生效，此 chip 即该物理 backend 的全局并发闸。不再需要直接手改 DB JSONB 字段。

**前端可见性**：`/admin/preannotate-summary` 透传 `ml_backend_max_concurrency` 给 `ProjectCardGrid` 卡片 + `ProjectDetailPanel` 头部展示「最多 N 并发」，多 batch 并行预标时给 admin 心理预期。

**触发**：admin 反馈「多 batch 并行预标」需要并发护盾，否则单 backend 被打爆会导致 grounded-sam2 GPU OOM 风险。

---

## 5. 协议契约与官方实现对照

请求、响应与 `/managed-models` 协议细节以 [Inference Protocol v2](/plugins/protocols/inference-v2) 为准。

- **多阶段编排（`atom` / `composite`）**：由能力声明协议引入（[ADR-0043](https://github.com/YOAO-Labs/YOAO/blob/dev/docs/adr/archive/0043-staged-preannotation-pipeline.md)），仅 `atom` 模型可作为全局编排的下游 Stage，`composite` 适合单阶段开箱即用。
- **自训模型回流**：平台通过 `POST /managed-models` 下发冻结训练权重并在回执中锁定 `inference_runtime`；Ultralytics 与 LibreYOLO 的完整支持范围分见 [YOLO 插件](/plugins/official/inference/yolo) 与 [LibreYOLO 插件](/plugins/official/inference/libreyolo)。
- **跨插件属性与 OCR 映射**：[ONNXTools](/plugins/official/inference/onnxtools) 自报 `output_attribute_schema` 预填属性，[RapidOCR](/plugins/official/inference/rapidocr) 的 `ocr-rec` 可作为任意上游框检测器的下游识别 Stage。

---

## 7. 能力协商 + 模态派生

平台对 backend 的「能力 / 模态」有持久化感知。实现集中在两个文件：

- `apps/inference/src/yoao_inference/capabilities.py`（`extract_capabilities` + `derive_modalities`）
- `apps/api/app/services/ml_backend.py`（`check_health`）

### 7.1 健康检查时能力快照落库

`check_health` 拉完 `/health`（得到 `healthy + meta`）后，best-effort 再探一次 `/setup`，把能力快照写入 `health_meta["capabilities"]`：

```python
# apps/api/app/services/ml_backend.py  check_health()
caps = extract_capabilities(await client.setup())
if caps is not None:
    meta = {**meta, "capabilities": caps}
    backend.is_interactive = caps["is_interactive"]   # 改派生对账
backend.health_meta = meta
```

探测失败（网络抖动 / backend 尚未实现 `/setup`）捕获后静默跳过，不影响 `check_health` 的 bool 返回值。`HealthMeta` schema 用 `extra="allow"`，无需 alembic 迁移。

### 7.2 能力快照字段

`health_meta["capabilities"]` 由 `extract_capabilities(setup_resp)` 填充，字段来自 backend `/setup` 响应：

| 字段                          | 类型        | 含义                                                 |
| ----------------------------- | ----------- | ---------------------------------------------------- |
| `is_interactive`              | `bool`      | backend 是否为交互式（点/框/文本 prompt 模式）       |
| `supported_prompts`           | `list[str]` | 支持的 prompt 类型，如 `["point","bbox","text"]`     |
| `supported_trackers`          | `list[str]` | 支持的 tracker，如 `["sam2_video"]`                  |
| `supported_text_outputs`      | `list[str]` | 文本类输出，如 `["caption"]`                         |
| `supported_geometric_outputs` | `list[str]` | 几何类输出，如 `["polygonlabels","rectanglelabels"]` |
| `modalities`                  | `list[str]` | 派生字段，见 §7.3                                    |

### 7.3 模态派生规则

`derive_modalities(caps)` 从能力快照推断支持的标注模态（不入库、读时算，同步写入快照中）：

```python
# apps/inference/src/yoao_inference/capabilities.py
if caps.get("supported_prompts"):   # 非空 ⇒ image
    modalities.append("image")
if caps.get("supported_trackers"):  # 非空 ⇒ video
    modalities.append("video")
```

`grounded-sam2-backend` 只有 `supported_prompts` 时 `modalities=["image"]`；上报 `supported_trackers: ["sam2_video"]` 时 `modalities=["image","video"]`。

### 7.4 绑定校验（PATCH /projects/{id}）

项目绑定 backend（`PATCH /projects/{id}`）时平台实时探 `/setup` 派生模态，与项目 `data_type` 不兼容则返回 422；探测失败 fail-open 放行（避免 backend 瞬时宕机卡住绑定，真正的模态不匹配留到 `/predict` 时暴露）。

### 7.5 `is_interactive` 改派生对账

`is_interactive` 由 backend `/setup.is_interactive` 自报并在每次 `check_health` 回写；注册/编辑表单不再手填 checkbox（只显示「健康检查时自动探测」提示），create/update payload 不带 `is_interactive`。

---
