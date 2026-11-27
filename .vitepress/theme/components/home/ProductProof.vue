<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { withBase } from "vitepress";
import { Motion } from "motion-v";
import { TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-vue-next";
import FrameSection from "./FrameSection.vue";
import { HOME_SECTIONS, type ProofMediaClip, type ProofScene } from "./home-contract";

const scenes: readonly [ProofScene, ...ProofScene[]] = [
  {
    id: "scene-image-ai",
    no: "01",
    kicker: "IMAGE / SAM3 & OCR",
    title: "图像交互分割与文档识别",
    desc: "智能点、智能框、Magic Box、Exemplar 四种交互分割，以及 RapidOCR 文档文本识别。",
    href: withBase("/user-guide/workbench/sam-tool"),
    ctaLabel: "查看图像 AI 标注指南",
    kind: "carousel",
    clips: [
      {
        id: "smart-point",
        no: "01",
        name: "智能点",
        kicker: "POINT PROMPT",
        desc: "在目标上点一下，SAM3 返回贴合车辆轮廓的多个候选掩码。",
        meta: "SMART POINT · ONE CLICK · CANDIDATE MASKS",
        src: withBase("/home/sam-tools/smart-point.webm"),
        fallbackSrc: withBase("/home/sam-tools/smart-point.mp4"),
        poster: withBase("/home/sam-tools/smart-point-poster.webp"),
        alt: "在真实道路图中点击白色车辆，使用 SAM3 生成轮廓候选",
      },
      {
        id: "smart-box",
        no: "02",
        name: "智能框",
        kicker: "BOX PROMPT",
        desc: "拖框限定目标范围，让 SAM3 在框内提取完整车辆边界。",
        meta: "SMART BOX · BOX PROMPT · POLYGON RESULT",
        src: withBase("/home/sam-tools/smart-box.webm"),
        fallbackSrc: withBase("/home/sam-tools/smart-box.mp4"),
        poster: withBase("/home/sam-tools/smart-box-poster.webp"),
        alt: "在真实道路图中框选白色车辆，使用 SAM3 提取车辆边界",
      },
      {
        id: "magic-box",
        no: "03",
        name: "Magic Box",
        kicker: "TIGHT BBOX",
        desc: "只需粗框目标，SAM3 自动收紧为贴合车辆的矩形框，再确认类别。",
        meta: "MAGIC BOX · AUTO TIGHTEN · HUMAN ACCEPT",
        src: withBase("/home/ai-assisted-annotation.webm"),
        fallbackSrc: withBase("/home/ai-assisted-annotation.mp4"),
        poster: withBase("/home/ai-assisted-annotation-poster.webp"),
        alt: "在真实道路图中粗框白色车辆，使用 SAM3 收紧框并确认类别",
      },
      {
        id: "exemplar",
        no: "04",
        name: "Exemplar",
        kicker: "VISUAL EXAMPLE",
        desc: "框选一辆车作为视觉示例，一次找出全图中外观相似的目标。",
        meta: "EXEMPLAR · VISUAL QUERY · FIND SIMILAR",
        src: withBase("/home/sam-tools/exemplar.webm"),
        fallbackSrc: withBase("/home/sam-tools/exemplar.mp4"),
        poster: withBase("/home/sam-tools/exemplar-poster.webp"),
        alt: "在真实道路图中框选白色车辆作为视觉示例，找出全图相似车辆",
      },
      {
        id: "rapid-ocr",
        no: "05",
        name: "RapidOCR",
        kicker: "DOCUMENT OCR",
        desc: "真实文档图进入当前题推理，生成文本多边形并保留模型版本与参数上下文。",
        meta: "RAPIDOCR · CURRENT TASK · TRACEABLE PARAMS",
        src: withBase("/home/ocr-real-scene.webm"),
        fallbackSrc: withBase("/home/ocr-real-scene.mp4"),
        poster: withBase("/home/ocr-real-scene-poster.webp"),
        alt: "真实 OCR 当前题从启动推理到生成文本多边形候选",
      },
    ],
  },
  {
    id: "scene-video",
    no: "02",
    kicker: "VIDEO / TRACKING",
    title: "视频轨迹与掩码传播",
    desc: "在连续时间轴上标记关键帧并自动跨帧追踪，出现漂移时单帧修正即可重新传播。",
    href: withBase("/user-guide/workbench/video-track"),
    ctaLabel: "查看视频追踪指南",
    kind: "video",
    clip: {
      id: "workbench-overview",
      no: "01",
      name: "总览时间轴",
      kicker: "VIDEO WORKBENCH",
      desc: "在视频工作台切换帧轨、核验目标轨迹状态，并在时间轴上快速定位关键帧。",
      meta: "VIDEO TRACK · TIMELINE · KEYFRAME STATE",
      src: withBase("/media/video/workbench-overview.mp4"),
      poster: withBase("/media/video/workbench-overview-poster.webp"),
      alt: "视频追踪工作台与时间轴关键帧总览实机录屏",
    },
    alternateClips: [
      {
        id: "mask-correction-propagate",
        no: "02",
        name: "掩码修正传播",
        kicker: "MASK PROPAGATION",
        desc: "在漂移帧直接修正掩码轮廓，再向后续帧重新传播，保持长序列边界贴合。",
        meta: "MASK CORRECTION · RE-PROPAGATE · TEMPORAL SYNC",
        src: withBase("/media/video/mask-correction-propagate.mp4"),
        poster: withBase("/media/video/mask-correction-propagate-poster.webp"),
        alt: "在视频单帧修正目标掩码并向后续帧传播的实机录屏",
      },
    ],
  },
  {
    id: "scene-pointcloud",
    no: "03",
    kicker: "3D / LIDAR & CAMERA",
    title: "3D 点云与多相机种框",
    desc: "基于多传感器标定外参在相机画面直接种下 3D 立方体，并联动跨帧轨迹传播。",
    href: withBase("/user-guide/workbench/3d-box"),
    ctaLabel: "查看 3D 点云指南",
    kind: "video",
    clip: {
      id: "camera-seed-3d-box",
      no: "01",
      name: "相机种框联动",
      kicker: "CAMERA SEED 3D",
      desc: "在 2D 多相机视图种框，同步生成 3D 点云立方体与三视图投影边界。",
      meta: "LIDAR + CAMERA · 2D-TO-3D SEED · CALIBRATED SYNC",
      src: withBase("/media/pointcloud/camera-seed-3d-box.mp4"),
      poster: withBase("/media/pointcloud/camera-seed-3d-box-poster.webp"),
      alt: "在多相机画面种框并联动生成 3D 点云立方体的实机录屏",
    },
    alternateClips: [
      {
        id: "crossframe-track",
        no: "02",
        name: "跨帧轨迹传播",
        kicker: "3D SEQUENCE TRACK",
        desc: "沿连续点云序列传播 3D 框位姿与朝向，快速完成时序微调与核验。",
        meta: "3D SEQUENCE · POSE PROPAGATION · MULTI-FRAME",
        src: withBase("/media/pointcloud/crossframe-track.mp4"),
        poster: withBase("/media/pointcloud/crossframe-track-poster.webp"),
        alt: "3D 点云连续帧中立方体跨帧轨迹传播的实机录屏",
      },
    ],
  },
  {
    id: "scene-review",
    no: "04",
    kicker: "REVIEW / DISCUSSION",
    title: "质检退回与画布讨论",
    desc: "结构化退回缺陷类型并记录审计轨迹，在画布与视频时间码锚点上完成协作闭环。",
    href: withBase("/user-guide/review/"),
    ctaLabel: "查看审核与协作指南",
    kind: "video",
    clip: {
      id: "reject-flow",
      no: "01",
      name: "结构化退回",
      kicker: "STRUCTURED REJECT",
      desc: "审核退回时记录具体缺陷类型与返工意见，保持角色隔离与状态流转可追溯。",
      meta: "QUALITY REVIEW · REJECT REASONS · AUDIT TRAIL",
      src: withBase("/media/review/reject-flow.mp4"),
      poster: withBase("/media/review/reject-flow-poster.webp"),
      alt: "审核员执行结构化退回并记录缺陷原因的实机录屏",
    },
    alternateClips: [
      {
        id: "video-issue-resolution",
        no: "02",
        name: "视频问题闭环",
        kicker: "CANVAS DISCUSSION",
        desc: "在视频画布定位问题帧发起讨论与提醒，跟踪修改直至标记解决。",
        meta: "PIN DISCUSSION · VIDEO TIMECODE · ISSUE RESOLVED",
        src: withBase("/media/discussion/video-issue-resolution.mp4"),
        poster: withBase("/media/discussion/video-issue-resolution-poster.webp"),
        alt: "在视频工作台画布锚点发起讨论并完成问题闭环的实机录屏",
      },
    ],
  },
  {
    id: "scene-ops",
    no: "05",
    kicker: "STORAGE / GPU POOL",
    title: "存储治理与 GPU 模型池",
    desc: "统一配置外部存储连接器并即时验证连通性，在模型市场观测 GPU 显存与推理服务池。",
    href: withBase("/user-guide/datasets/storage-connections"),
    ctaLabel: "查看存储与模型池指南",
    kind: "video",
    clip: {
      id: "storage-connector-create-test",
      no: "01",
      name: "存储连接器测试",
      kicker: "ZERO-COPY STORAGE",
      desc: "配置外部存储连接器并现场执行连通测试，支撑零拷贝引用入库。",
      meta: "STORAGE CONNECTOR · CONNECTION TEST · ZERO-COPY",
      src: withBase("/media/datasets/storage-connector-create-test.mp4"),
      poster: withBase("/media/datasets/storage-connector-create-test-poster.webp"),
      alt: "创建外部存储连接器并执行连通性测试的实机录屏",
    },
    alternateClips: [
      {
        id: "gpu-resources",
        no: "02",
        name: "GPU 显存与服务池",
        kicker: "GPU & MODEL POOL",
        desc: "集中查看集群 GPU 显存分布、已加载模型实例与推理后端健康状态。",
        meta: "MODEL MARKET · GPU TELEMETRY · INFERENCE POOL",
        src: withBase("/media/superadmin/model-market/gpu-resources.mp4"),
        poster: withBase("/media/superadmin/model-market/gpu-resources-poster.webp"),
        alt: "模型市场查看 GPU 显存资源与推理服务池状态的实机录屏",
      },
    ],
  },
];

function getSceneClips(scene: ProofScene): readonly ProofMediaClip[] {
  switch (scene.kind) {
    case "carousel":
      return scene.clips;
    case "video":
      return scene.alternateClips ? [scene.clip, ...scene.alternateClips] : [scene.clip];
    case "image":
      return [];
    default: {
      const _exhaustive: never = scene;
      return _exhaustive;
    }
  }
}

function videoMimeType(src: string): "video/webm" | "video/mp4" {
  return src.endsWith(".webm") ? "video/webm" : "video/mp4";
}

function formatCount(n: number): string {
  return String(n).padStart(2, "0");
}

const activeSceneId = ref<string>(scenes[0].id);
const activeClipIndex = ref(0);
const clipDirection = ref<1 | -1>(1);

const activeScene = computed<ProofScene>(
  () => scenes.find((scene) => scene.id === activeSceneId.value) ?? scenes[0],
);
const sceneClips = computed<readonly ProofMediaClip[]>(() => getSceneClips(activeScene.value));
const activeClip = computed<ProofMediaClip | null>(
  () => sceneClips.value[activeClipIndex.value] ?? sceneClips.value[0] ?? null,
);
const clipTransitionName = computed(() =>
  clipDirection.value === 1 ? "proof-clip-next" : "proof-clip-prev",
);
const headerBadge = computed(() => {
  switch (activeScene.value.kind) {
    case "carousel":
      return `SAM3 & OCR / ${activeClip.value?.no ?? "01"}`;
    case "video":
      return `REAL WORKFLOW / ${activeScene.value.no}`;
    case "image":
      return `REAL PRODUCT / ${activeScene.value.no}`;
    default: {
      const _exhaustive: never = activeScene.value;
      return _exhaustive;
    }
  }
});
const headerMeta = computed(() =>
  activeClip.value
    ? activeClip.value.meta
    : activeScene.value.kind === "image"
      ? activeScene.value.meta
      : "",
);
const footerMeta = computed(() => {
  switch (activeScene.value.kind) {
    case "carousel":
      return `${sceneClips.value.length} CLIPS · SAM3 & RAPIDOCR`;
    case "video":
      return sceneClips.value.length > 1
        ? `${sceneClips.value.length} CLIPS · REAL WORKFLOW`
        : "REAL WORKFLOW";
    case "image":
      return "REAL PRODUCT";
    default: {
      const _exhaustive: never = activeScene.value;
      return _exhaustive;
    }
  }
});

const videoRef = ref<HTMLVideoElement | null>(null);
const sectionRef = ref<HTMLElement | null>(null);
const autoplayVideo = ref(false);
const mediaInView = ref(false);
const videoPlaying = ref(false);
const touchStartX = ref<number | null>(null);
let mediaObserver: IntersectionObserver | undefined;

async function playActiveVideo(): Promise<void> {
  await nextTick();
  if (!activeClip.value || !autoplayVideo.value || !mediaInView.value) return;
  const video = videoRef.value;
  if (!video) return;
  await video
    .play()
    .then(() => {
      videoPlaying.value = true;
    })
    .catch(() => {
      videoPlaying.value = false;
    });
}

function selectClip(index: number): void {
  const total = sceneClips.value.length;
  if (total === 0 || index < 0 || index >= total || index === activeClipIndex.value) return;
  clipDirection.value = index > activeClipIndex.value ? 1 : -1;
  activeClipIndex.value = index;
}

function stepClip(delta: 1 | -1): void {
  const total = sceneClips.value.length;
  if (total <= 1) return;
  clipDirection.value = delta;
  activeClipIndex.value = (activeClipIndex.value + delta + total) % total;
}

async function toggleVideo(): Promise<void> {
  const video = videoRef.value;
  if (!video) return;
  if (video.paused) {
    await video
      .play()
      .then(() => {
        videoPlaying.value = true;
      })
      .catch(() => {
        videoPlaying.value = false;
      });
  } else {
    video.pause();
    videoPlaying.value = false;
  }
}

function onCarouselKeydown(event: KeyboardEvent): void {
  if (event.currentTarget !== event.target) return;
  if (event.key === "ArrowRight") stepClip(1);
  else if (event.key === "ArrowLeft") stepClip(-1);
  else return;
  event.preventDefault();
}

function onTouchStart(event: TouchEvent): void {
  touchStartX.value = event.touches[0]?.clientX ?? null;
}

function onTouchEnd(event: TouchEvent): void {
  if (touchStartX.value === null) return;
  const endX = event.changedTouches[0]?.clientX;
  const delta = endX === undefined ? 0 : endX - touchStartX.value;
  touchStartX.value = null;
  if (Math.abs(delta) < 44) return;
  stepClip(delta < 0 ? 1 : -1);
}

onMounted(() => {
  autoplayVideo.value =
    window.innerWidth > 600 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  mediaObserver = new IntersectionObserver(
    ([entry]) => {
      mediaInView.value = entry?.isIntersecting ?? false;
      if (mediaInView.value) void playActiveVideo();
      else {
        videoRef.value?.pause();
        videoPlaying.value = false;
      }
    },
    { threshold: 0.15 },
  );
  if (sectionRef.value) mediaObserver.observe(sectionRef.value);
});

onBeforeUnmount(() => mediaObserver?.disconnect());

watch(activeSceneId, () => {
  activeClipIndex.value = 0;
  clipDirection.value = 1;
});

watch([activeSceneId, activeClipIndex], () => {
  videoPlaying.value = false;
  void playActiveVideo();
});
</script>

<template>
  <FrameSection :id="HOME_SECTIONS.proof.id" corners="both">
    <div ref="sectionRef" class="scroll-mt-16">
      <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <span class="font-mono text-[11px] tracking-[0.12em] text-fg-subtle uppercase">
            {{ HOME_SECTIONS.proof.kicker }}
          </span>
          <h2 class="mt-3 text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.2] tracking-[-0.03em] text-fg">
            真实工作台与多模态推理实录
          </h2>
        </div>
        <p class="max-w-[490px] text-[15px] leading-relaxed text-fg-muted">
          全部基于真实工作台录屏，与上方交互演示互补。覆盖图像 SAM3 分割与 OCR、视频轨迹传播、3D 点云多相机种框、质检退回协作，以及存储连接与 GPU 模型池治理。
        </p>
      </div>

      <TabsRoot
        v-model="activeSceneId"
        class="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[0.38fr_minmax(0,1fr)] lg:items-start"
      >
        <TabsList
          class="flex min-w-0 gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-rail lg:pb-0"
          aria-label="真实产品场景"
        >
          <TabsTrigger
            v-for="scene in scenes"
            :key="scene.id"
            :value="scene.id"
            class="group relative flex min-w-[230px] max-w-[270px] shrink-0 items-start gap-3.5 rounded-[var(--yoao-radius)] border border-border bg-surface p-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent lg:min-w-0 lg:max-w-none lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:border-rail lg:bg-transparent lg:px-4 lg:py-4"
            :class="
              activeSceneId === scene.id
                ? 'border-border-strong bg-surface-alt lg:bg-surface-alt/70'
                : 'hover:bg-surface-alt/40'
            "
          >
            <Motion
              v-if="activeSceneId === scene.id"
              layout-id="proof-scene-bar"
              class="hidden lg:block lg:absolute lg:inset-y-0 lg:left-0 lg:w-0.5 lg:bg-ai-solid"
              :transition="{ type: 'spring', stiffness: 420, damping: 36 }"
            />
            <span class="pt-0.5 font-mono text-[11px] text-fg-subtle">{{ scene.no }}</span>
            <span class="flex min-w-0 flex-col">
              <small class="font-mono text-[10px] tracking-[0.08em] text-ai uppercase">
                {{ scene.kicker }}
              </small>
              <strong class="mt-1 text-[15.5px] font-semibold tracking-[-0.015em] text-fg">
                {{ scene.title }}
              </strong>
              <span class="mt-1 text-[13px] leading-relaxed text-fg-muted">
                {{ scene.desc }}
              </span>
            </span>
          </TabsTrigger>
        </TabsList>

        <div class="min-w-0">
          <div
            class="overflow-hidden rounded-[var(--yoao-radius-lg)] border border-border bg-surface shadow-[var(--yoao-shadow-md)]"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-2 border-b border-divider bg-surface-alt px-4 py-2.5"
            >
              <span
                class="inline-flex items-center rounded-full border border-ai-border bg-ai-soft px-2.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-ai uppercase"
              >
                {{ headerBadge }}
              </span>
              <span class="font-mono text-[10.5px] tracking-[0.06em] text-fg-subtle uppercase">
                {{ headerMeta }}
              </span>
            </div>

            <div
              v-if="activeScene.kind === 'carousel' && activeClip"
              class="relative outline-none"
              role="region"
              aria-roledescription="carousel"
              aria-label="图像交互分割与文档识别实录"
              tabindex="0"
              @keydown="onCarouselKeydown"
              @touchstart.passive="onTouchStart"
              @touchend.passive="onTouchEnd"
            >
              <div class="relative aspect-video overflow-hidden bg-bg-subtle">
                <Transition :name="clipTransitionName" @after-enter="playActiveVideo">
                  <video
                    :id="`proof-video-${activeScene.id}-${activeClip.id}`"
                    :key="`${activeScene.id}:${activeClip.id}`"
                    ref="videoRef"
                    class="absolute inset-0 h-full w-full object-cover object-top"
                    :poster="activeClip.poster"
                    muted
                    loop
                    playsinline
                    :preload="autoplayVideo && mediaInView ? 'metadata' : 'none'"
                    :aria-label="activeClip.alt"
                    @play="videoPlaying = true"
                    @pause="videoPlaying = false"
                  >
                    <source :src="activeClip.src" :type="videoMimeType(activeClip.src)" />
                    <source
                      v-if="activeClip.fallbackSrc"
                      :src="activeClip.fallbackSrc"
                      :type="videoMimeType(activeClip.fallbackSrc)"
                    />
                  </video>
                </Transition>
                <button
                  type="button"
                  class="absolute right-3 bottom-3 z-10 inline-flex items-center gap-1.5 rounded-[var(--yoao-radius-sm)] border border-border-strong bg-surface/90 px-2.5 py-1.5 font-mono text-[10.5px] font-medium text-fg shadow-[var(--yoao-shadow-sm)] backdrop-blur-md transition-colors hover:bg-surface"
                  :aria-controls="`proof-video-${activeScene.id}-${activeClip.id}`"
                  :aria-label="
                    videoPlaying ? `暂停${activeClip.name}演示` : `播放${activeClip.name}演示`
                  "
                  @click="toggleVideo"
                >
                  <Pause v-if="videoPlaying" class="size-3 text-ai" />
                  <Play v-else class="size-3 text-ai" />
                  <span>{{ videoPlaying ? "PAUSE" : "PLAY" }}</span>
                </button>
              </div>

              <div
                class="grid gap-2 border-t border-divider bg-surface px-4 py-3.5 sm:grid-cols-[0.38fr_1fr] sm:items-center sm:gap-6"
              >
                <div>
                  <span class="font-mono text-[10px] tracking-[0.08em] text-ai uppercase">
                    {{ activeClip.no }} / {{ formatCount(sceneClips.length) }} · {{ activeClip.kicker }}
                  </span>
                  <strong class="mt-0.5 block text-[15px] font-semibold text-fg">
                    {{ activeClip.name }}
                  </strong>
                </div>
                <p class="m-0 text-[13.5px] leading-relaxed text-fg-muted">
                  {{ activeClip.desc }}
                </p>
              </div>

              <div class="grid grid-cols-[40px_minmax(0,1fr)_40px] border-t border-divider bg-surface-alt">
                <button
                  type="button"
                  class="inline-flex min-h-[40px] items-center justify-center border-r border-divider text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
                  aria-label="上一个图像 AI 演示"
                  @click="stepClip(-1)"
                >
                  <ChevronLeft class="size-4" />
                </button>
                <div
                  class="flex min-w-0 overflow-x-auto sm:grid sm:grid-cols-5 sm:overflow-visible"
                  role="group"
                  aria-label="选择图像 AI 演示"
                >
                  <button
                    v-for="(clip, index) in sceneClips"
                    :key="clip.id"
                    type="button"
                    class="min-h-[40px] shrink-0 whitespace-nowrap border-r border-divider px-3 text-[12px] font-medium transition-colors last:border-r-0 sm:min-w-0 sm:truncate sm:px-2"
                    :class="
                      activeClipIndex === index
                        ? 'bg-surface font-semibold text-ai'
                        : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                    "
                    :aria-pressed="activeClipIndex === index"
                    @click="selectClip(index)"
                  >
                    <span class="mr-1 hidden font-mono text-[10px] text-fg-subtle sm:inline">
                      {{ clip.no }}
                    </span>
                    {{ clip.name }}
                  </button>
                </div>
                <button
                  type="button"
                  class="inline-flex min-h-[40px] items-center justify-center border-l border-divider text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
                  aria-label="下一个图像 AI 演示"
                  @click="stepClip(1)"
                >
                  <ChevronRight class="size-4" />
                </button>
              </div>
            </div>

            <div v-else-if="activeScene.kind === 'video' && activeClip">
              <div class="relative aspect-video overflow-hidden bg-bg-subtle">
                <video
                  :id="`proof-video-${activeScene.id}-${activeClip.id}`"
                  :key="`${activeScene.id}:${activeClip.id}`"
                  ref="videoRef"
                  class="block h-full w-full object-cover object-top"
                  :poster="activeClip.poster"
                  muted
                  loop
                  playsinline
                  :preload="autoplayVideo && mediaInView ? 'metadata' : 'none'"
                  :aria-label="activeClip.alt"
                  @play="videoPlaying = true"
                  @pause="videoPlaying = false"
                >
                  <source :src="activeClip.src" :type="videoMimeType(activeClip.src)" />
                  <source
                    v-if="activeClip.fallbackSrc"
                    :src="activeClip.fallbackSrc"
                    :type="videoMimeType(activeClip.fallbackSrc)"
                  />
                </video>
                <button
                  type="button"
                  class="absolute right-3 bottom-3 z-10 inline-flex items-center gap-1.5 rounded-[var(--yoao-radius-sm)] border border-border-strong bg-surface/90 px-2.5 py-1.5 font-mono text-[10.5px] font-medium text-fg shadow-[var(--yoao-shadow-sm)] backdrop-blur-md transition-colors hover:bg-surface"
                  :aria-controls="`proof-video-${activeScene.id}-${activeClip.id}`"
                  :aria-label="
                    videoPlaying ? `暂停${activeClip.name}演示` : `播放${activeClip.name}演示`
                  "
                  @click="toggleVideo"
                >
                  <Pause v-if="videoPlaying" class="size-3 text-ai" />
                  <Play v-else class="size-3 text-ai" />
                  <span>{{ videoPlaying ? "PAUSE" : "PLAY" }}</span>
                </button>
              </div>

              <div
                class="grid gap-2 border-t border-divider bg-surface px-4 py-3.5 sm:grid-cols-[0.38fr_1fr] sm:items-center sm:gap-6"
              >
                <div>
                  <span class="font-mono text-[10px] tracking-[0.08em] text-ai uppercase">
                    {{ activeClip.no }} / {{ formatCount(sceneClips.length) }} · {{ activeClip.kicker }}
                  </span>
                  <strong class="mt-0.5 block text-[15px] font-semibold text-fg">
                    {{ activeClip.name }}
                  </strong>
                </div>
                <p class="m-0 text-[13.5px] leading-relaxed text-fg-muted">
                  {{ activeClip.desc }}
                </p>
              </div>

              <div
                v-if="sceneClips.length > 1"
                class="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-surface-alt px-4 py-2.5"
                role="group"
                :aria-label="`切换${activeScene.title}录屏片段`"
              >
                <span class="font-mono text-[10px] tracking-[0.06em] text-fg-subtle uppercase">
                  CLIP · {{ activeClip.no }} / {{ formatCount(sceneClips.length) }}
                </span>
                <div class="inline-flex flex-wrap items-center gap-1.5">
                  <button
                    v-for="(clip, index) in sceneClips"
                    :key="clip.id"
                    type="button"
                    class="inline-flex min-h-[30px] items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors"
                    :class="
                      activeClipIndex === index
                        ? 'border-ai-border bg-ai-soft font-semibold text-ai'
                        : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                    "
                    :aria-pressed="activeClipIndex === index"
                    @click="selectClip(index)"
                  >
                    <span class="font-mono text-[10px] opacity-75">{{ clip.no }}</span>
                    <span>{{ clip.name }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="activeScene.kind === 'image'" class="bg-bg-subtle">
              <img
                :src="activeScene.src"
                :alt="activeScene.alt"
                class="block aspect-[16/10] w-full object-contain object-top"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-surface px-4 py-2.5">
              <span class="font-mono text-[10.5px] text-fg-subtle uppercase">
                {{ footerMeta }}
              </span>
              <a
                :href="activeScene.href"
                class="group inline-flex items-center gap-1.5 text-[13px] font-medium text-accent no-underline transition-colors hover:text-accent-hover"
              >
                <span>{{ activeScene.ctaLabel ?? "查看对应指南" }}</span>
                <ArrowUpRight class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>
      </TabsRoot>
    </div>
  </FrameSection>
</template>

<style scoped>
.proof-clip-next-enter-active,
.proof-clip-next-leave-active,
.proof-clip-prev-enter-active,
.proof-clip-prev-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.proof-clip-next-enter-from,
.proof-clip-prev-leave-to {
  opacity: 0;
  transform: translateX(6%);
}

.proof-clip-next-leave-to,
.proof-clip-prev-enter-from {
  opacity: 0;
  transform: translateX(-6%);
}

@media (prefers-reduced-motion: reduce) {
  .proof-clip-next-enter-active,
  .proof-clip-next-leave-active,
  .proof-clip-prev-enter-active,
  .proof-clip-prev-leave-active {
    transition: none;
  }
}
</style>
