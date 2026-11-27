# YOAO docs homepage quality polish plan

## What changes

The current homepage covers only a narrow slice of YOAO. Its Hero interactive module shows 2D vehicles and a basic 2D timeline, its real-product section covers only image AI and ML backend screenshots, its production loop ends at dataset export, and its four documentation cards omit major platform areas.

YOAO today is a four-repository ecosystem (`YOAO`, `YOAO-Plugins`, `Plugin-SDK`, `YOAO-Docs`) covering image, video, and 3D point cloud annotation, zero-copy storage and read-only Site Agents, decoupled online learning and model return, five plugin extension points with ten official plugins, and `yoao-sdk` automation for Python, CLI, TUI, and AI agents across 783 indexed v1 API routes and 275 documentation pages.

This plan reorganizes the homepage into six focused sections backed by build-time project statistics and a shared TypeScript data contract. It keeps the restrained Radix Colors, `FrameSection` grid rail, `reka-ui`, and `motion-v` design system intact while bringing every core product capability onto the landing page.

### Target six-section structure

1. `01 / Hero` (`DataAtlasHero.vue` + `WorkbenchHeroDemo.vue`): Multi-modality positioning copy, build-time verified capability strip, and a four-mode interactive workbench covering Image SAM3, Video Tracking, 3D Point Cloud with camera projection, and Online Learning model return.
2. `02 / Real product proof` (`ProductProof.vue`): Five live workflow categories backed by existing verified recordings in `public/home/` and `public/media/` covering Image SAM3 and OCR, Video Tracking, 3D Point Cloud camera-seeded cuboids, Review and Discussion, and Storage Connectors with GPU pools.
3. `03 / Data and online learning loop` (`DataProductionLoop.vue`): Six-stage closed loop from ingestion and zero-copy reference through AI pre-labeling, multimodal refinement, review with self-review prevention, frozen training versions with `yoao-trainer/v1`, and model return back to stage 02 plus open export formats.
4. `04 / Plugin ecosystem and developer interface` (`PluginEcosystem.vue`): Interactive five-extension-point explorer (`inference`, `trainer`, `notification_channel`, `format_adapter`, `theme`) with the three-repository boundary strip, paired with a four-tab developer command switcher (`yoao CLI`, `Python SDK`, `Plugin-SDK`, `Agent & Streams`).
5. `05 / Documentation paths by role and task` (`DocumentationPaths.vue`): Six-cell architectural hairline grid covering Workbench and AI, Datasets and Online Learning, Plugin Ecosystem, API/SDK/Agent, Deploy and Ops, and Core Dev and Changelog.
6. `06 / Closing call to action` (`DocsHome.vue` + `index.md`): Tight closing action panel with four direct entry links and three-repository footer links.

### Measured trunk baseline (`http://127.0.0.1:4179/`)

Every performance gate below compares against these measurements taken on trunk before any implementation starts.

| Metric | Trunk baseline | Source |
| --- | --- | --- |
| Built `index.html` size | 119,840 bytes | `.vitepress/dist/index.html` |
| Built `style.*.css` size | 198,431 bytes | `.vitepress/dist/assets/` |
| Built `app.*.js` size | 1,195,918 bytes | `.vitepress/dist/assets/` |
| Initial network transfer at `1440x960` | 1,068,128 bytes (60 requests) | `agent-browser` resource timing |
| Initial media transfer at `1440x960` | 58,728 bytes (1 poster webp) | `agent-browser` resource timing |
| DOM node count at `1440x960` | 664 nodes (107 SVG child nodes) | `agent-browser` DOM query |
| Document scroll height (`1440x960` / `390x844`) | 4,137 px / 5,547 px | `agent-browser` layout query |
| Horizontal overflow (`1440x960`, `390x844`) | `false` / `false` | `agent-browser` layout query |
| Hero simulator top / bottom at `1440x960` | 485 px / 928 px (above fold) | `agent-browser` bounding rect |

### UI driver resolution

This repository does not yet contain `.agents/skills/verify/` or `.claude/skills/verify/`. Live verification uses `agent-browser` CLI through existing `scripts/check-reading-layout.mjs` plus the new `scripts/check-home-quality.mjs` introduced in `PR-01`.

### Product preference calls for operator signoff before execution

No automated run can settle these three product choices. The plan sets concrete defaults so work can start immediately once you confirm or adjust them.

1. Proof media strategy in `PR-03`: Default keeps hybrid real recordings (existing MP4/WebM clips in `public/home/` and `public/media/` with `preload="none"`) for all five real-product categories and removes the unused static `model-market/list.png` import. Alternative replaces `PR-03` categories 04 and 05 with pure code-rendered Vue simulations.
2. Dynamic statistics in `PR-01` and `PR-02`: Default reads live counts (`783` routes, `10` official plugins, `5` extension points, `275` doc pages) from `home-stats.generated.json` into the Hero capability strip and section kickers. Alternative keeps purely qualitative labels without counts.
3. Page length budget in `PR-06`: Default caps desktop `1440x960` scroll height at 5,800 px across six sections. Alternative folds `03` and `04` into a single tabbed band to stay under 4,600 px.

## PR ids in landing order

1. `PR-01` (`home-01-foundation`): Build-time home stats generator, typed domain contract, and live homepage quality probe.
2. `PR-02` (`home-02-hero-multimodal`): Hero positioning copy, generated facts strip, and four-modality workbench simulator.
3. `PR-03` (`home-03-real-proof-multimodal`): Five-domain real product proof using verified existing media and clean orphan-asset updates.
4. `PR-04` (`home-04-online-learning-loop`): Six-stage closed data and online learning loop with return arc and real stage artifacts.
5. `PR-05` (`home-05-plugin-ecosystem`): Five-extension-point explorer and four-tab developer/CLI/SDK/Agent code switcher mounted on `/_components`.
6. `PR-06` (`home-06-paths-assembly-closing`): Six-cell documentation matrix, six-section `DocsHome.vue` assembly, `index.md` metadata update, and final verification.

## Dependency graph

```text
trunk
  └── PR-01 (foundation: stats generator, home-contract.ts, check-home-quality.mjs)
        ├── PR-02 (independent: DataAtlasHero.vue, WorkbenchHeroDemo.vue)       [Review-Gated]
        ├── PR-03 (independent: ProductProof.vue, asset-references.test.mjs)    [Review-Gated]
        ├── PR-04 (independent: DataProductionLoop.vue)                         [Review-Gated]
        └── PR-05 (independent: PluginEcosystem.vue, ComponentsPlayground.vue)  [Review-Gated]
              │
              ▼ (after PR-02, PR-03, PR-04, PR-05 merge)
        PR-06 (DocumentationPaths.vue, DocsHome.vue, index.md)                  [Review-Gated]
```

### Branching and file ownership matrix

| PR id | Branches from | Waits for | Review-gated | Exclusive files |
| --- | --- | --- | --- | --- |
| `PR-01` | `trunk` | None | No | `scripts/generate-home-stats.mjs`, `scripts/generate-home-stats.test.mjs`, `scripts/check-home-quality.mjs`, `.vitepress/theme/generated/home-stats.generated.json`, `.vitepress/theme/components/home/home-contract.ts`, `package.json`, `dev/reference/generated-artifacts.md` |
| `PR-02` | `PR-01` | `PR-01` | Yes | `.vitepress/theme/components/home/DataAtlasHero.vue`, `.vitepress/theme/components/home/WorkbenchHeroDemo.vue` |
| `PR-03` | `PR-01` | `PR-01` | Yes | `.vitepress/theme/components/home/ProductProof.vue`, `scripts/asset-references.test.mjs`, `user-guide/images/superadmin/model-market/list.png` (remove if unreferenced elsewhere) |
| `PR-04` | `PR-01` | `PR-01` | Yes | `.vitepress/theme/components/home/DataProductionLoop.vue` |
| `PR-05` | `PR-01` | `PR-01` | Yes | `.vitepress/theme/components/home/PluginEcosystem.vue`, `.vitepress/theme/components/ComponentsPlayground.vue` |
| `PR-06` | `trunk` after `PR-02`..`PR-05` | `PR-02`, `PR-03`, `PR-04`, `PR-05` | Yes | `.vitepress/theme/components/home/DocumentationPaths.vue`, `.vitepress/theme/components/DocsHome.vue`, `index.md` |

`PR-02`, `PR-03`, `PR-04`, and `PR-05` touch disjoint files and can execute in parallel in isolated git worktrees once `PR-01` lands.

---

## PR-01 (`home-01-foundation`): Build-time stats, domain contract, and live quality probe

- [x] **Depends on:** `trunk` (no upstream PR).
- [x] **Files edited:**
  - Create `scripts/generate-home-stats.mjs`
  - Create `scripts/generate-home-stats.test.mjs`
  - Create `scripts/check-home-quality.mjs`
  - Create `.vitepress/theme/generated/home-stats.generated.json`
  - Create `.vitepress/theme/components/home/home-contract.ts`
  - Edit `package.json` (wire `generate-home-stats.mjs` into `predev`, `prebuild`, `gen`, `check:codegen`, and add `check:home`)
  - Edit `dev/reference/generated-artifacts.md` (document `home-stats.generated.json` ownership)
- [x] **One change built:**
  - Generate `.vitepress/theme/generated/home-stats.generated.json` from real sources: `api/guides/_routes.generated.md` or `apps/api/app/api/v1` (route and module counts), `YOAO-Plugins` manifest directories (official plugin counts per extension point), `Plugin-SDK` extension points (`5`), and `public/llms.txt` (doc page count). Support `--check` mode matching `scripts/_emit.mjs`.
  - Define single-source TypeScript types and section metadata (`HOME_SECTIONS` numbering `01` through `06`, `HeroModality`, `ProofCategory`, `LoopStage`, `ExtensionPointSpec`, `DevSnippetSpec`, `DocPathCard`) in `.vitepress/theme/components/home/home-contract.ts`.
  - Build `scripts/check-home-quality.mjs` using `agent-browser` to verify `/` (and optional `--route /_components`) across `1440x960`, `768x960`, and `390x844` in both light and dark modes, asserting zero console errors, zero page errors, zero horizontal overflow, valid SVG/DOM bounds, lazy media loading, and keyboard tab navigation.
- [x] **Result seen:** Running `node scripts/generate-home-stats.mjs --check` exits 0 with verified counts (`783` routes, `121` modules, `10` official plugins, `5` extension points, `275` doc pages), and `scripts/check-home-quality.mjs` passes against trunk preview and fails on a seeded regression (for example, forcing horizontal overflow or breaking a tab trigger).
- [x] **Unit verification:**
  - Run `node --test scripts/generate-home-stats.test.mjs` (covers stats extraction, deterministic JSON formatting, `--check` drift detection, and missing-repo error handling).
  - Run `pnpm check:all`.
- [x] **Live verification:**
  - In the PR worktree, run `pnpm build` and start `vitepress preview` on an isolated port.
  - Run `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/` via `agent-browser`.
  - Pass predicate: script asserts zero console errors, zero uncaught page errors, zero horizontal overflow across `1440x960`, `768x960`, and `390x844` in light and dark themes, and prints JSON metrics matching trunk.
  - Seed one deliberate bad threshold test (pass `--max-dom-nodes 100`) and confirm `check-home-quality.mjs` exits non-zero naming the exact metric diff.
- [x] **Perf verification:**
  - Metric: `index.html` bytes, `app.*.js` bytes, initial `transferTotalBytes` at `1440x960`.
  - Probe: `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/ --json`.
  - Trunk baseline: `index.html` 119,840 B, `app.*.js` 1,195,918 B, initial transfer 1,068,128 B, DOM 664 nodes.
  - Fail threshold: `PR-01` adds no rendered UI; fail if `app.*.js` grows by more than 4 KB, initial transfer grows by more than 4 KB, or DOM node count changes.

---

## PR-02 (`home-02-hero-multimodal`): Hero copy, generated facts strip, and four-modality workbench simulator

- [x] **Depends on:** `PR-01`.
- [x] **Files edited:**
  - Edit `.vitepress/theme/components/home/DataAtlasHero.vue`
  - Edit `.vitepress/theme/components/home/WorkbenchHeroDemo.vue`
- [x] **One change built:**
  - Update `DataAtlasHero.vue` heading, lead paragraph, primary and secondary actions, and bottom strip consuming `home-stats.generated.json` (`图像 · 视频 · 3D 点云`, `在线学习与模型回流`, `5 扩展点 · 10 官方插件`, `783 API 路由 · yoao-sdk`, `零拷贝引用 · 站点 Agent`, `MIT 开源 · 私有化部署`).
  - Refactor `WorkbenchHeroDemo.vue` around a four-modality discriminated union from `home-contract.ts`:
    1. `image-sam3`: interactive road scene with click-to-segment Smart Point, plus compact sub-mode toggle for Magic Box tighten and Exemplar recall, and `Accept Candidate (A)` state confirmation.
    2. `video-track`: 24-frame scrubbable timeline showing AI keyframes versus human correction seed frames with smooth play and pause.
    3. `pointcloud-3d`: lightweight SVG BEV LiDAR point cluster with selectable 3D cuboids, yaw heading arrow, and synchronized 2D multi-camera bounding-box projection inset (zero WebGL or Three.js dependency).
    4. `online-learning`: frozen training dataset version card (`SHA-256` verified), `yoao-trainer/v1` epoch mAP50 sparkline, and interactive `发布为默认预标` toggle that updates the active pre-labeler status badge.
  - Keep all colors on semantic CSS variables from `tokens.css` (zero hardcoded hex/rgb values) and honor `prefers-reduced-motion: reduce`.
- [x] **Result seen:** Opening `/` shows the revised positioning copy, the four-modality workbench simulator above the fold on `1440x960`, working click and keyboard tab switching across Image, Video, 3D Point Cloud, and Online Learning, and the generated facts strip aligned to the rail grid.
- [x] **Unit verification:**
  - Run `pnpm check:tokens` (0 hardcoded color errors).
  - Run `pnpm check:all`.
- [x] **Live verification:**
  - In the PR worktree, build and serve via `vitepress preview`.
  - Drive `/` with `agent-browser`: click each of the four modality tabs (`image-sam3`, `video-track`, `pointcloud-3d`, `online-learning`), interact inside each canvas (click a target vehicle, scrub video frame to `F14`, select a 3D cuboid and verify camera projection updates, toggle `发布为默认预标`), verify `恢复演示` restores auto-play, and test keyboard arrow navigation on `TabsList`.
  - Run `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/` and capture light/dark screenshots at `1440x960` and `390x844`.
  - Pass predicate: all four modalities update canvas and inspector text without console errors, Hero simulator top stays <= 520 px at `1440x960`, and zero overflow occurs at `1440`, `768`, and `390`.
- [x] **Perf verification:**
  - Metric: `app.*.js` delta, Hero SVG child node count, and initial transfer bytes at `1440x960`.
  - Probe: `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/ --json` plus `stat` on `.vitepress/dist/assets/app.*.js`.
  - Trunk baseline: `app.*.js` 1,195,918 B, total SVG child nodes 107, initial transfer 1,068,128 B.
  - Fail threshold: fail if `app.*.js` grows by more than 25 KB, active Hero SVG child nodes exceed 180 in any single tab, or initial transfer exceeds 1,120,000 B.
- [x] **Operator interaction review gate:** Wait for operator review of screenshots and live Hero interaction before merge.

---

## PR-03 (`home-03-real-proof-multimodal`): Five-domain real product proof

- [x] **Depends on:** `PR-01`.
- [x] **Files edited:**
  - Edit `.vitepress/theme/components/home/ProductProof.vue`
  - Edit `scripts/asset-references.test.mjs`
  - Remove `user-guide/images/superadmin/model-market/list.png` (only after verifying zero remaining references outside `ProductProof.vue`)
- [x] **One change built:**
  - Replace the four image-only tabs in `ProductProof.vue` with five product-wide real recording categories driven by `ProofCategory` from `home-contract.ts`, reusing verified media already stored in `public/home/` and `public/media/`:
    1. `01 / 图像与交互式 AI`: five-slide carousel keeping SAM3 (`smart-point`, `smart-box`, `ai-assisted-annotation`, `exemplar`) and RapidOCR (`ocr-real-scene`), linked to `/user-guide/workbench/sam-tool` and `/user-guide/ai/`.
    2. `02 / 视频追踪与跨帧传播`: real recording `/media/video/workbench-overview.mp4` with `/media/video/workbench-overview-poster.webp` (plus switchable clip `/media/video/mask-correction-propagate.mp4`), linked to `/user-guide/workbench/video-track`.
    3. `03 / 3D 点云与多相机种框`: real recording `/media/pointcloud/camera-seed-3d-box.mp4` with `/media/pointcloud/camera-seed-3d-box-poster.webp`, linked to `/user-guide/workbench/3d-box`.
    4. `04 / 质量审核与画布协作`: real recording `/media/review/reject-flow.mp4` with `/media/review/reject-flow-poster.webp` (or switchable clip `/media/discussion/video-issue-resolution.mp4`), linked to `/user-guide/review/`.
    5. `05 / 存储治理与 GPU 模型池`: two-clip toggle between `/media/datasets/storage-connector-create-test.mp4` and `/media/superadmin/model-market/gpu-resources.mp4`, linked to `/user-guide/datasets/storage-connections` and `/user-guide/superadmin/model-market`.
  - Preserve `preload="none"` and `IntersectionObserver` lazy playback so inactive tabs never fetch video bytes on initial load.
  - Update `scripts/asset-references.test.mjs` to match the updated homepage asset set and confirm `check-orphan-images.mjs --strict` has zero orphan images.
- [x] **Result seen:** Section `02` proves real product workflows across image, video, 3D point cloud, review, and storage/GPU management, with keyboard-accessible tab switching, working Play/Pause buttons, and direct guide links.
- [x] **Unit verification:**
  - Run `pnpm test:references`.
  - Run `node scripts/check-orphan-images.mjs --strict`.
  - Run `pnpm check:tokens` and `pnpm check:all`.
- [x] **Live verification:**
  - In the PR worktree, build and serve via `vitepress preview`.
  - Drive `#proof` with `agent-browser`: scroll into view, verify initial poster renders (`naturalWidth > 0`), click through all five scene tabs and sub-tool carousel arrows, verify each `<video>` resolves HTTP 200 on its poster and video source when selected, toggle Play/Pause, and verify every guide CTA link starts with base path and returns HTTP 200.
  - Run `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/`.
  - Pass predicate: zero broken media (`naturalWidth === 0` or video error code != null), zero console errors, zero overflow at `1440`, `768`, and `390` in light and dark mode.
- [x] **Perf verification:**
  - Metric: initial media transfer bytes at `1440x960` above-the-fold load (before scrolling to `#proof`) and total repo media byte delta.
  - Probe: `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/ --json`.
  - Trunk baseline: initial media transfer 58,728 bytes (1 poster webp, zero `.mp4`/`.webm` fetched on initial load).
  - Fail threshold: fail if initial load fetches any `.mp4` or `.webm` before `#proof` enters viewport, or if initial media transfer exceeds 85,000 bytes.
- [x] **Operator interaction review gate:** Wait for operator review of scene selection, clip pacing, and light/dark screenshots before merge.

---

## PR-04 (`home-04-online-learning-loop`): Six-stage closed data and online learning loop

- [x] **Depends on:** `PR-01`.
- [x] **Files edited:**
  - Edit `.vitepress/theme/components/home/DataProductionLoop.vue`
- [x] **One change built:**
  - Expand `DataProductionLoop.vue` from five open steps ending at export to a six-stage closed loop typed by `LoopStage` in `home-contract.ts`:
    1. `01 / 接入与零拷贝治理` (`DATA`): managed upload, zero-copy `reference` (local/S3/SFTP), read-only Site Agent, SHA-256 verification.
    2. `02 / AI 预标候选` (`PRE-LABELED`): SAM3, Grounded-SAM2, YOLO, RapidOCR, multi-stage pipelines; Prediction stays isolated from formal Annotation.
    3. `03 / 多模态人工精修` (`REFINED`): Image Bbox/OBB/Mask/Large-Image Pyramid, Video keyframe propagation, 3D cuboid and camera sync.
    4. `04 / 质量审核与协同` (`APPROVED`): role separation, contributor-evidenced self-review rejection, four structured reject types, pin discussions and `@mention`.
    5. `05 / 冻结版本与在线训练` (`TRAINED`): immutable Training Data Version with `input_membership` receipt, `yoao-trainer/v1` offline container runs (`Ultralytics`, `LibreYOLO`), per-sample evaluation, active learning selection.
    6. `06 / 模型回流与开放导出` (`DEPLOYED`): qualified model returns to stage `02` as default pre-labeler while exporting COCO, YOLO, MOT, KITTI, NuScenes, and Native JSON 2.0.
  - Add a clean SVG return path connecting stage `06` back to stage `02` (static under `prefers-reduced-motion: reduce`).
  - Remove the placeholder `<DemoSkeleton variant="inspector" :rows="2" />` block from the sticky inspector card and replace it with structured stage-specific evidence badges and a direct documentation link for each stage.
- [x] **Result seen:** Selecting or hovering stages `01` through `06` updates the vertical rail, return-loop indicator, structured lineage metadata, evidence badges, and deep link without placeholder skeleton bars.
- [x] **Unit verification:**
  - Run `pnpm check:tokens` and `pnpm check:dead-links`.
  - Run `pnpm check:all`.
- [x] **Live verification:**
  - In the PR worktree, build and serve via `vitepress preview`.
  - Drive `#flow` with `agent-browser`: click stages `01` through `06`, verify sticky card title, status badge, lineage rows, evidence badges, and guide link update on every click, verify stage `06` highlights the return arc to stage `02`, verify zero `.yoao-skeleton` nodes remain inside `#flow`, and verify `prefers-reduced-motion: reduce` disables SVG dash animation.
  - Run `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/`.
  - Pass predicate: all six stages interactive via mouse and keyboard, all six guide links return HTTP 200, zero console errors, zero overflow at `1440`, `768`, and `390`.
- [x] **Perf verification:**
  - Metric: `#flow` section height at `1440x960` and DOM node delta.
  - Probe: `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/ --json`.
  - Trunk baseline: `#flow` height 755 px, total page DOM 664 nodes.
  - Fail threshold: fail if `#flow` height exceeds 960 px at `1440x960` or total DOM grows by more than 120 nodes.
- [x] **Operator interaction review gate:** Wait for operator review of loop copy, return-arc animation, and sticky card layout before merge.

---

## PR-05 (`home-05-plugin-ecosystem`): Modular plugin ecosystem and developer interface

- [x] **Depends on:** `PR-01`.
- [x] **Files edited:**
  - Create `.vitepress/theme/components/home/PluginEcosystem.vue`
  - Edit `.vitepress/theme/components/ComponentsPlayground.vue` (mount `PluginEcosystem` in `/_components` so this PR is independently live-verifiable before `PR-06` mounts it on `/`)
- [x] **One change built:**
  - Create `PluginEcosystem.vue` using `FrameSection`, `reka-ui` `TabsRoot`, `motion-v`, and `lucide-vue-next`, split into two clean rows inside one section:
    - **Extension points and three-repository architecture:** Interactive five-tab selector (`inference`, `trainer`, `notification_channel`, `format_adapter`, `theme`) showing protocol identifier (`yoao-inference/v2`, `yoao-trainer/v1`, `yoao-notification-channel/v1`, `yoao-format-adapter/v1`, `yoao-theme/v1`), execution model (OCI `--network none` container, D1 direct mode, static CSS variable pack), official plugins from `YOAO-Plugins` with verified count from `home-stats.generated.json`, and a compact three-repository footer bar (`YOAO`, `YOAO-Plugins`, `Plugin-SDK`).
    - **Developer and agent interface:** Interactive four-tab code switcher (`yoao CLI`, `Python SDK`, `Plugin-SDK`, `Agent & Streams`) with verified real commands (`yoao plugins inspect-image` / `qualify`, `from yoao import Client`, `yoao-plugin init --type trainer` / `validate`, `yoao capabilities --json` / `yoao describe`), a working clipboard copy button with temporary `Copied` confirmation, a realistic structured JSON or CLI output panel, and direct links to `/sdk/quickstart`, `/plugins/sdk/`, `/sdk/agents`, and `/api/`.
  - Style code tokens with lightweight semantic CSS classes using variables from `tokens.css` so no runtime syntax-highlighter library enters the client bundle.
- [x] **Result seen:** `/_components` renders `PluginEcosystem` cleanly in light and dark modes; all five extension tabs, all four developer tabs, and the copy button work smoothly with crisp visual restraint matching `FrameSection`.
- [x] **Unit verification:**
  - Run `pnpm check:tokens` (0 hardcoded colors).
  - Run `pnpm check:dead-links` and `pnpm check:all`.
- [x] **Live verification:**
  - In the PR worktree, build and serve via `vitepress preview`.
  - Drive `/_components` with `agent-browser`: switch across all five extension-point tabs and assert protocol id and plugin list update; switch across all four developer tabs (`yoao CLI`, `Python SDK`, `Plugin-SDK`, `Agent & Streams`), click Copy and assert button state switches to copied feedback; verify all internal links return HTTP 200; test `1440x960`, `768x960`, and `390x844` in light and dark themes.
  - Run `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/_components --route /_components`.
  - Pass predicate: zero console errors, zero horizontal overflow (including `<pre>` code blocks on `390px` mobile via `overflow-x-auto`), and every tab renders non-empty verified content.
- [x] **Perf verification:**
  - Metric: `app.*.js` delta, `style.*.css` delta, and `PluginEcosystem` DOM node count.
  - Probe: `stat` on built `.vitepress/dist/assets/{app,style}.*` plus `agent-browser` DOM count on `[data-plugin-ecosystem]`.
  - Trunk baseline: `app.*.js` 1,195,918 B, `style.*.css` 198,431 B.
  - Fail threshold: fail if `app.*.js` grows by more than 20 KB, `style.*.css` grows by more than 10 KB, or `[data-plugin-ecosystem]` exceeds 220 DOM nodes.
- [x] **Operator interaction review gate:** Wait for operator review of extension-point wording, code snippets, and mobile code-block legibility before merge.

---

## PR-06 (`home-06-paths-assembly-closing`): Six-cell docs matrix, homepage assembly, and closing polish

- [x] **Depends on:** `PR-02`, `PR-03`, `PR-04`, `PR-05`.
- [x] **Files edited:**
  - Edit `.vitepress/theme/components/home/DocumentationPaths.vue`
  - Edit `.vitepress/theme/components/DocsHome.vue`
  - Edit `index.md`
- [x] **One change built:**
  - Upgrade `DocumentationPaths.vue` from a 2x2 four-card grid to a 3x2 six-card architectural hairline grid (`md:grid-cols-2 lg:grid-cols-3`) aligned to `YOAO-Docs` navigation:
    1. `01 / WORKBENCH & AI` -> `/user-guide/` (快速开始, 多模态工作台, AI 辅助标注, 审核流程)
    2. `02 / DATA & LEARNING` -> `/user-guide/datasets/` (数据集工作台, 零拷贝与站点 Agent, 训练数据版本, 模型回流与主动学习)
    3. `03 / EXTEND` -> `/plugins/` (10 个官方插件, 安装与资格验收, Plugin-SDK, 五大扩展协议)
    4. `04 / INTEGRATE` -> `/api/` (OpenAPI 参考, Python SDK, yoao CLI 与 TUI, Agent 接入与事件流)
    5. `05 / DEPLOY & OPS` -> `/ops/` (Docker Compose 与局域网部署, 只读站点 Agent, 备份与存储迁移, 排障手册)
    6. `06 / BUILD` -> `/dev/` (本地多工作树开发, 系统架构地图, 性能基线, 更新日志)
  - Assemble the final six-band order in `DocsHome.vue`: `DataAtlasHero` (`01`), `ProductProof` (`02`), `DataProductionLoop` (`03`), `PluginEcosystem` (`04`), `DocumentationPaths` (`05`), and Closing CTA (`06`) with four direct rows (`快速开始`, `探索插件生态`, `部署运维`, `API 与 SDK`) and footer links to `YOAO`, `YOAO-Plugins`, and `Plugin-SDK`.
  - Update `index.md` frontmatter `description` to cover multimodal annotation, online learning, plugin ecosystem, and private deployment.
- [x] **Result seen:** Visiting `/` presents a cohesive six-section narrative with sequential section numbers `01` through `06`, zero missing platform capabilities, working links to every major doc hub, and intact light/dark restraint.
- [x] **Unit verification:**
  - Run `pnpm check:all` (snippets, frontmatter, freshness, strict orphan images, asset references, diagrams, strict navigation coverage, strict readability, codegen including `home-stats`, dead links, and theme tokens).
  - Run `DOCS_BASE=/YOAO-Docs/ pnpm build` and `pnpm build` (both base prefixes exit 0).
- [x] **Live verification:**
  - In the PR worktree, serve the root build on an isolated port.
  - Run `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/` across `1440x960`, `768x960`, and `390x844` in light and dark modes.
  - Run `node scripts/check-reading-layout.mjs verify http://127.0.0.1:<port>/ <baseline.json>` to confirm zero regressions on the 12 inner reading routes and tablet homepage menu contrast >= 4.5.
  - Crawl every `<a href>` inside `.docs-home` (internal routes) via `curl` and assert 100% return HTTP 200 under both `/` and `/YOAO-Docs/` builds.
  - Pass predicate: sequential section kickers `02` through `06` appear in DOM order, zero broken links, zero console errors, zero horizontal overflow across all breakpoints and themes.
- [x] **Perf verification:**
  - Metric: end-to-end homepage `scrollHeight` (`1440x960`), total DOM nodes, initial `transferTotalBytes`, initial media bytes, and `app.*.js` / `style.*.css` bundle totals.
  - Probe: `node scripts/check-home-quality.mjs http://127.0.0.1:<port>/ --json` plus `.vitepress/dist/assets/` file sizes.
  - Trunk baseline: `scrollHeight` 4,137 px (`1440x960`), DOM 664 nodes, initial transfer 1,068,128 B, initial media 58,728 B, `app.*.js` 1,195,918 B, `style.*.css` 198,431 B.
  - Fail threshold: fail if `scrollHeight` exceeds 5,800 px at `1440x960`, total DOM nodes exceed 1,250, initial transfer exceeds 1,250,000 B, initial media exceeds 85,000 B, `app.*.js` grows by more than 65 KB total over trunk, or `style.*.css` grows by more than 20 KB total over trunk.
- [x] **Operator interaction review gate:** Wait for operator full-page light/dark desktop and mobile visual signoff before merge.
