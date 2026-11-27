<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from "vue";
import { Motion } from "motion-v";
import { TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import {
  Box,
  BoxSelect,
  Check,
  Film,
  Pause,
  Play,
  RotateCcw,
  ScanSearch,
  Sparkle,
  Target,
  TrendingUp,
} from "lucide-vue-next";
import DemoCursor from "../demo/DemoCursor.vue";
import type { HeroModalityId, HeroModalityMeta } from "./home-contract";

type ImageSubMode = "smart-point" | "magic-box" | "exemplar";
type TrainerId = "ultralytics" | "libreyolo";
type EpochId = "E10" | "E30" | "E50";
type StatusTone = "ai" | "positive" | "caution";

interface ModalityItem extends HeroModalityMeta {
  readonly icon: Component;
  readonly prompt: string;
}

interface Box2D {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface VehicleSpec {
  readonly id: string;
  readonly label: string;
  readonly kind: "car" | "van";
  readonly score: string;
  readonly box: Box2D;
  readonly roughBox: Box2D;
  readonly poly: string;
  readonly point: { readonly x: number; readonly y: number };
}

interface Cuboid3DSpec {
  readonly id: string;
  readonly label: string;
  readonly score: string;
  readonly dims: string;
  readonly distance: string;
  readonly yawDeg: number;
  readonly bev: { readonly cx: number; readonly cy: number; readonly w: number; readonly h: number };
  readonly cam2d: Box2D & { readonly dx: number; readonly dy: number };
}

interface EpochMilestone {
  readonly id: EpochId;
  readonly label: string;
  readonly map50: string;
  readonly loss: string;
  readonly x: number;
  readonly y: number;
  readonly note: string;
}

interface TrainerSpec {
  readonly id: TrainerId;
  readonly name: string;
  readonly short: string;
  readonly license: string;
  readonly protocol: string;
  readonly map50: string;
  readonly delta: string;
  readonly baselineLabel: string;
  readonly baselineY: number;
  readonly artifact: string;
  readonly curvePath: string;
  readonly areaPath: string;
  readonly milestones: readonly EpochMilestone[];
}

interface SidebarItem {
  readonly id: string;
  readonly label: string;
  readonly meta: string;
  readonly active: boolean;
  readonly activeClass: string;
  readonly dotClass: string;
  readonly select: () => void;
}

interface SidebarModel {
  readonly heading: string;
  readonly items: readonly SidebarItem[];
  readonly footA: readonly [string, string];
  readonly footB: readonly [string, string, string];
}

interface InspectorModel {
  readonly statusLabel: string;
  readonly statusTone: StatusTone;
  readonly title: string;
  readonly rows: readonly { readonly label: string; readonly value: string; readonly tone?: StatusTone }[];
  readonly hint: string;
  readonly actionLabel: string;
  readonly actionActive: boolean;
}

const MODALITIES: readonly ModalityItem[] = [
  {
    id: "image-sam3",
    label: "图像 · SAM3",
    short: "图像",
    badge: "SAM3",
    summary: "单点磁吸掩码、智能框收紧与视觉示例召回，采纳后进入正式标注。",
    icon: Target,
    prompt: "点击目标或切换子工具交互",
  },
  {
    id: "video-track",
    label: "视频轨迹",
    short: "视频",
    badge: "TRACK",
    summary: "24 帧轨迹时间轴，区分 AI 关键帧与人工修正种子帧。",
    icon: Film,
    prompt: "点击时间轴帧格查看跨帧轨迹",
  },
  {
    id: "pointcloud-3d",
    label: "3D 点云",
    short: "3D 点云",
    badge: "LIDAR",
    summary: "LiDAR BEV 俯视 3D 框与 CAM_FRONT 2D 投影实时联动。",
    icon: Box,
    prompt: "点击 3D 立方体同步相机投影",
  },
  {
    id: "online-learning",
    label: "在线学习",
    short: "在线学习",
    badge: "TRAIN",
    summary: "基于冻结已审版本训练，并将达标模型回流为默认预标。",
    icon: TrendingUp,
    prompt: "切换训练器并发布回流预标",
  },
];

const IMAGE_SUB_MODES: readonly { readonly id: ImageSubMode; readonly label: string; readonly icon: Component }[] = [
  { id: "smart-point", label: "Smart Point", icon: Target },
  { id: "magic-box", label: "Magic Box", icon: BoxSelect },
  { id: "exemplar", label: "Exemplar", icon: ScanSearch },
];

const VEHICLES: readonly VehicleSpec[] = [
  {
    id: "v1",
    label: "car #1",
    kind: "car",
    score: "0.98",
    box: { x: 96, y: 148, w: 98, h: 46 },
    roughBox: { x: 78, y: 134, w: 134, h: 72 },
    poly: "98,173 108,151 164,149 191,164 193,191 97,191",
    point: { x: 146, y: 170 },
  },
  {
    id: "v2",
    label: "car #2",
    kind: "car",
    score: "0.95",
    box: { x: 258, y: 108, w: 86, h: 40 },
    roughBox: { x: 242, y: 95, w: 118, h: 66 },
    poly: "260,130 270,111 318,109 341,123 343,146 259,146",
    point: { x: 300, y: 128 },
  },
  {
    id: "v3",
    label: "van #3",
    kind: "van",
    score: "0.93",
    box: { x: 382, y: 152, w: 112, h: 52 },
    roughBox: { x: 364, y: 138, w: 146, h: 78 },
    poly: "384,174 396,154 472,154 491,172 492,202 383,202",
    point: { x: 438, y: 178 },
  },
  {
    id: "v4",
    label: "car #4",
    kind: "car",
    score: "0.91",
    box: { x: 454, y: 78, w: 78, h: 36 },
    roughBox: { x: 440, y: 66, w: 106, h: 58 },
    poly: "456,98 465,80 508,80 529,92 531,112 455,112",
    point: { x: 492, y: 96 },
  },
];

const CUBOIDS_3D: readonly Cuboid3DSpec[] = [
  {
    id: "c1",
    label: "car #1",
    score: "0.97",
    dims: "4.52×1.88×1.54m",
    distance: "14.2 m",
    yawDeg: 10,
    bev: { cx: 132, cy: 146, w: 36, h: 66 },
    cam2d: { x: 416, y: 136, w: 66, h: 46, dx: 12, dy: -8 },
  },
  {
    id: "c2",
    label: "van #2",
    score: "0.94",
    dims: "5.30×2.04×2.28m",
    distance: "21.6 m",
    yawDeg: -8,
    bev: { cx: 244, cy: 96, w: 42, h: 78 },
    cam2d: { x: 496, y: 106, w: 46, h: 42, dx: -8, dy: -5 },
  },
  {
    id: "c3",
    label: "cyclist #3",
    score: "0.92",
    dims: "1.85×0.72×1.62m",
    distance: "11.4 m",
    yawDeg: 24,
    bev: { cx: 274, cy: 192, w: 20, h: 36 },
    cam2d: { x: 538, y: 148, w: 30, h: 48, dx: -10, dy: -7 },
  },
];

const BEV_SPARSE_DOT_PATH =
  "M56 172h.1M74 148h.1M96 126h.1M128 104h.1M162 86h.1M198 76h.1M236 74h.1M274 84h.1M308 102h.1M338 128h.1M356 162h.1" +
  "M86 196h.1M108 178h.1M174 148h.1M212 146h.1M250 156h.1M296 172h.1M322 198h.1M152 216h.1M232 214h.1";
const BEV_ROAD_DOT_PATH =
  "M92 212h.1M98 188h.1M104 164h.1M110 132h.1M116 100h.1M122 68h.1M128 42h.1" +
  "M286 212h.1M282 184h.1M278 156h.1M274 128h.1M270 98h.1M266 68h.1M262 42h.1" +
  "M188 184h.1M194 162h.1M190 128h.1M196 98h.1M192 64h.1";
const BEV_OBJECT_DOT_PATH =
  "M120 124h.1M128 128h.1M136 132h.1M144 138h.1M124 146h.1M132 152h.1M140 160h.1M126 168h.1M138 170h.1" +
  "M228 68h.1M236 72h.1M246 74h.1M256 80h.1M232 90h.1M244 96h.1M254 104h.1M236 114h.1M248 122h.1M256 126h.1" +
  "M268 180h.1M274 186h.1M278 192h.1M272 198h.1M276 204h.1";

const TRAINERS: readonly TrainerSpec[] = [
  {
    id: "ultralytics",
    name: "Ultralytics (YOLOv11)",
    short: "YOLOv11",
    license: "AGPL-3.0",
    protocol: "yoao-trainer/v1",
    map50: "0.892",
    delta: "+6.4%",
    baselineLabel: "上版基线 0.828",
    baselineY: 54,
    artifact: "yoao-det-v2.4-y11.pt",
    curvePath: "M36 104C66 94 80 86 110 78C160 66 204 50 254 40C310 30 354 22 412 18",
    areaPath: "M36 104C66 94 80 86 110 78C160 66 204 50 254 40C310 30 354 22 412 18L412 112L36 112Z",
    milestones: [
      { id: "E10", label: "E10", map50: "0.742", loss: "0.418", x: 110, y: 78, note: "热身收敛 · 召回稳定" },
      { id: "E30", label: "E30", map50: "0.846", loss: "0.231", x: 254, y: 40, note: "难例重加权 · 精度跃升" },
      { id: "E50", label: "E50 Best", map50: "0.892", loss: "0.149", x: 412, y: 18, note: "离线验收达标 · 可回流预标" },
    ],
  },
  {
    id: "libreyolo",
    name: "LibreYOLO9 (MIT)",
    short: "LibreYOLO9",
    license: "MIT",
    protocol: "yoao-trainer/v1",
    map50: "0.864",
    delta: "+4.8%",
    baselineLabel: "上版基线 0.816",
    baselineY: 60,
    artifact: "yoao-det-v2.4-ly9.onnx",
    curvePath: "M36 106C68 98 84 92 110 86C160 74 204 60 254 50C310 40 354 32 412 28",
    areaPath: "M36 106C68 98 84 92 110 86C160 74 204 60 254 50C310 40 354 32 412 28L412 112L36 112Z",
    milestones: [
      { id: "E10", label: "E10", map50: "0.718", loss: "0.462", x: 110, y: 86, note: "冷启动拟合 · 权重稳定" },
      { id: "E30", label: "E30", map50: "0.821", loss: "0.268", x: 254, y: 50, note: "多尺度增强 · 误检下降" },
      { id: "E50", label: "E50 Best", map50: "0.864", loss: "0.184", x: 412, y: 28, note: "MIT 许可验收 · 可回流预标" },
    ],
  },
];

const STATUS_BADGE_CLASS: Record<StatusTone, string> = {
  ai: "border-ai-border bg-ai-soft text-ai",
  positive: "border-positive-border bg-positive-soft text-positive",
  caution: "border-caution-border bg-caution-soft text-caution",
};

const VALUE_TONE_CLASS: Record<StatusTone, string> = {
  ai: "text-ai",
  positive: "text-positive",
  caution: "text-caution",
};

const TOTAL_FRAMES = 24;
const AI_KEYFRAMES = new Set([0, 6, 14, 22]);
const MANUAL_KEYFRAMES = new Set([10, 18]);

const modality = ref<HeroModalityId>("image-sam3");
const imageSubMode = ref<ImageSubMode>("smart-point");
const activeVehicleId = ref<string>("v1");
const acceptedVehicles = ref<Record<string, boolean>>({});
const boxTightened = ref(true);

const videoFrame = ref(8);
const videoPlaying = ref(true);

const activeCuboidId = ref<string>("c1");
const acceptedCuboids = ref<Record<string, boolean>>({});

const activeTrainerId = ref<TrainerId>("ultralytics");
const activeEpochId = ref<EpochId>("E50");
const deployedTrainerId = ref<TrainerId | null>(null);

const manualControl = ref(false);
const canvasStageRef = ref<HTMLElement | null>(null);
const cursorCoords = ref({ x: 180, y: 170 });
const cursorClicking = ref(false);
const reduceMotion = ref(false);

let demoTimer: number | undefined;
let frameTimer: number | undefined;
let tightenTimer: number | undefined;
let clickTimer: number | undefined;
let demoStep = 0;

const activeModalityMeta = computed(() => MODALITIES.find((m) => m.id === modality.value) ?? MODALITIES[0]);
const activeVehicle = computed(() => VEHICLES.find((v) => v.id === activeVehicleId.value) ?? VEHICLES[0]);
const activeCuboid = computed(() => CUBOIDS_3D.find((c) => c.id === activeCuboidId.value) ?? CUBOIDS_3D[0]);
const activeTrainer = computed(() => TRAINERS.find((t) => t.id === activeTrainerId.value) ?? TRAINERS[0]);
const activeMilestone = computed(
  () => activeTrainer.value.milestones.find((m) => m.id === activeEpochId.value) ?? activeTrainer.value.milestones[2],
);

const isActiveVehicleAccepted = computed(() => Boolean(acceptedVehicles.value[activeVehicleId.value]));
const isActiveCuboidAccepted = computed(() => Boolean(acceptedCuboids.value[activeCuboidId.value]));
const isActiveTrainerDeployed = computed(() => deployedTrainerId.value === activeTrainerId.value);
const ghostCuboids = computed(() => CUBOIDS_3D.filter((c) => c.id !== activeCuboidId.value));

const recalledIds = computed(() => {
  if (modality.value !== "image-sam3" || imageSubMode.value !== "exemplar") return new Set<string>();
  return new Set(
    VEHICLES.filter((v) => v.kind === activeVehicle.value.kind || v.id === activeVehicleId.value).map((v) => v.id),
  );
});

const frameKindLabel = computed(() => {
  if (AI_KEYFRAMES.has(videoFrame.value)) return "AI 关键帧";
  if (MANUAL_KEYFRAMES.has(videoFrame.value)) return "人工种子帧";
  return "插值传播帧";
});

const activeCuboidColor = computed(() => ({
  stroke: isActiveCuboidAccepted.value ? "var(--yoao-positive-solid)" : "var(--yoao-ai-solid)",
  fill: isActiveCuboidAccepted.value ? "var(--yoao-positive-soft)" : "var(--yoao-ai-soft)",
}));

function formatYaw(deg: number): string {
  return `${deg >= 0 ? "+" : ""}${deg}°`;
}

function isVehicleAccepted(id: string): boolean {
  return Boolean(acceptedVehicles.value[id]);
}

function isCuboidAccepted(id: string): boolean {
  return Boolean(acceptedCuboids.value[id]);
}

function cuboidBevPalette(c: Cuboid3DSpec) {
  const accepted = isCuboidAccepted(c.id);
  const selected = activeCuboidId.value === c.id;
  return {
    fill: selected ? (accepted ? "var(--yoao-positive-soft)" : "var(--yoao-ai-soft)") : "var(--yoao-surface)",
    stroke: accepted ? "var(--yoao-positive-solid)" : selected ? "var(--yoao-ai-solid)" : "var(--yoao-border-strong)",
    arrow: accepted ? "var(--yoao-positive-solid)" : selected ? "var(--yoao-ai-solid)" : "var(--yoao-fg-subtle)",
    text: selected ? (accepted ? "var(--yoao-positive)" : "var(--yoao-ai)") : "var(--yoao-fg-subtle)",
    width: selected ? 1.8 : 1.2,
  };
}

function projectedWireframeEdges(c: Cuboid3DSpec): string {
  const { x, y, w, h, dx, dy } = c.cam2d;
  const bx = x + dx;
  const by = y + dy;
  return `M${x} ${y}L${bx} ${by}M${x + w} ${y}L${bx + w} ${by}M${x} ${y + h}L${bx} ${by + h}M${x + w} ${y + h}L${bx + w} ${by + h}`;
}

function vehicleOverlayBox(v: VehicleSpec): (Box2D & { dashed: boolean }) | null {
  const accepted = isVehicleAccepted(v.id);
  if (modality.value === "image-sam3") {
    if (imageSubMode.value === "magic-box" && (activeVehicleId.value === v.id || accepted)) {
      const tight = boxTightened.value || accepted;
      return { ...(tight ? v.box : v.roughBox), dashed: !tight };
    }
    if (imageSubMode.value === "exemplar" && (recalledIds.value.has(v.id) || accepted)) {
      return { ...v.box, dashed: false };
    }
    return null;
  }
  if (modality.value === "video-track" && (activeVehicleId.value === v.id || v.id === "v2" || accepted)) {
    return { ...v.box, dashed: false };
  }
  return null;
}

function showVehiclePill(v: VehicleSpec): boolean {
  return (
    activeVehicleId.value === v.id ||
    isVehicleAccepted(v.id) ||
    (modality.value === "image-sam3" && imageSubMode.value === "exemplar" && recalledIds.value.has(v.id)) ||
    (modality.value === "video-track" && v.id === "v2")
  );
}

function vehiclePalette(v: VehicleSpec) {
  if (isVehicleAccepted(v.id)) {
    return { stroke: "var(--yoao-positive-solid)", fill: "var(--yoao-positive-soft)" };
  }
  if (modality.value === "image-sam3" && imageSubMode.value === "exemplar" && v.id === activeVehicleId.value) {
    return { stroke: "var(--yoao-accent-solid)", fill: "var(--yoao-accent-soft)" };
  }
  return { stroke: "var(--yoao-ai-solid)", fill: "var(--yoao-ai-soft)" };
}

function vehiclePillText(v: VehicleSpec): string {
  if (isVehicleAccepted(v.id)) return `${v.label} · 已采纳`;
  if (modality.value === "image-sam3" && imageSubMode.value === "exemplar" && v.id === activeVehicleId.value) {
    return `${v.label} · QUERY`;
  }
  if (modality.value === "video-track") return `${v.label} · F${String(videoFrame.value).padStart(2, "0")}`;
  return `${v.label} · ${v.score}`;
}

function vehicleMotionOffset(index: number): { dx: number; dy: number } {
  if (modality.value !== "video-track") return { dx: 0, dy: 0 };
  const t = videoFrame.value / TOTAL_FRAMES;
  const dir = index % 2 === 0 ? 1 : -1;
  return { dx: Math.round((t - 0.35) * 76 * dir), dy: Math.round((t - 0.35) * 10 * dir) };
}

const renderedVehicles = computed(() =>
  VEHICLES.map((v, index) => ({
    vehicle: v,
    offset: vehicleMotionOffset(index),
    accepted: isVehicleAccepted(v.id),
    palette: vehiclePalette(v),
    overlayBox: vehicleOverlayBox(v),
    showPill: showVehiclePill(v),
    pillText: vehiclePillText(v),
  })),
);

const sidebarModel = computed<SidebarModel>(() => {
  if (modality.value === "image-sam3" || modality.value === "video-track") {
    const doneCount = VEHICLES.filter((v) => isVehicleAccepted(v.id)).length;
    return {
      heading: modality.value === "image-sam3" ? "Targets · 2D" : "Tracks · 24F",
      items: VEHICLES.map((v) => {
        const active = activeVehicleId.value === v.id;
        const done = isVehicleAccepted(v.id);
        return {
          id: v.id,
          label: v.label,
          meta: done ? "OK" : v.score,
          active,
          activeClass: done ? "bg-positive-soft font-medium text-positive" : "bg-ai-soft font-medium text-ai",
          dotClass: done ? "bg-positive-solid" : active ? "bg-ai-solid" : "bg-border-strong",
          select: () => onClickVehicle(v),
        };
      }),
      footA: ["已采纳标注", `${doneCount} / ${VEHICLES.length}`],
      footB: ["引擎", modality.value === "image-sam3" ? "SAM 3" : "Tracker", "text-ai"],
    };
  }
  if (modality.value === "pointcloud-3d") {
    const doneCount = CUBOIDS_3D.filter((c) => isCuboidAccepted(c.id)).length;
    return {
      heading: "Objects · 3D",
      items: CUBOIDS_3D.map((c) => {
        const active = activeCuboidId.value === c.id;
        const done = isCuboidAccepted(c.id);
        return {
          id: c.id,
          label: c.label,
          meta: c.distance,
          active,
          activeClass: done ? "bg-positive-soft font-medium text-positive" : "bg-ai-soft font-medium text-ai",
          dotClass: done ? "bg-positive-solid" : active ? "bg-ai-solid" : "bg-border-strong",
          select: () => onSelectCuboid(c),
        };
      }),
      footA: ["已采纳 3D", `${doneCount} / ${CUBOIDS_3D.length}`],
      footB: ["外参投影", "SYNC OK", "text-positive"],
    };
  }
  return {
    heading: "Trainer Runs",
    items: TRAINERS.map((t) => {
      const active = activeTrainerId.value === t.id;
      const deployed = deployedTrainerId.value === t.id;
      return {
        id: t.id,
        label: t.short,
        meta: t.map50,
        active,
        activeClass: deployed ? "bg-positive-soft font-medium text-positive" : "bg-ai-soft font-medium text-ai",
        dotClass: deployed ? "bg-positive-solid" : active ? "bg-ai-solid" : "bg-caution-solid",
        select: () => onSelectTrainer(t.id),
      };
    }),
    footA: ["冻结版本", "v2.4"],
    footB: ["样本校验", "SHA-256", "text-positive"],
  };
});

const inspectorModel = computed<InspectorModel>(() => {
  if (modality.value === "image-sam3") {
    const accepted = isActiveVehicleAccepted.value;
    const subMap: Record<ImageSubMode, readonly [string, string, string]> = {
      "smart-point": ["SAM 3 · Point", "Polygon Mask", "单点触发轮廓磁吸生成掩码候选，确认后写入正式标注。"],
      "magic-box": [
        "SAM 3 · Magic Box",
        boxTightened.value ? "Tight BBox" : "Rough Input",
        "粗框自动贴合目标边界，候选与正式标注保持清晰隔离。",
      ],
      exemplar: [
        "SAM 3 · Exemplar",
        `${recalledIds.value.size} Matched Shapes`,
        "以当前目标为视觉示例，一键召回同画面同类目标候选。",
      ],
    };
    const [source, geometry, hint] = subMap[imageSubMode.value];
    return {
      statusLabel: accepted ? "已采纳正式标注" : "AI 候选",
      statusTone: accepted ? "positive" : "ai",
      title: activeVehicle.value.label,
      rows: [
        { label: "来源", value: source },
        { label: "几何", value: geometry },
        {
          label: "置信度",
          value: accepted ? `${activeVehicle.value.score} · 已确认` : activeVehicle.value.score,
          tone: accepted ? "positive" : "ai",
        },
      ],
      hint,
      actionLabel: accepted ? "已采纳正式标注 · 点击撤销" : "Accept Candidate (A)",
      actionActive: accepted,
    };
  }
  if (modality.value === "video-track") {
    const accepted = isActiveVehicleAccepted.value;
    return {
      statusLabel: accepted ? "已采纳轨迹" : "AI 候选",
      statusTone: accepted ? "positive" : "ai",
      title: `${activeVehicle.value.label} · Track`,
      rows: [
        { label: "来源", value: "Video AI Tracker" },
        { label: "帧位置", value: `F${String(videoFrame.value).padStart(2, "0")} / F${TOTAL_FRAMES}` },
        { label: "帧类型", value: frameKindLabel.value, tone: AI_KEYFRAMES.has(videoFrame.value) ? "ai" : undefined },
      ],
      hint: "紫色标记为 AI 关键帧，深色标记为人工修正种子帧，支持跨帧传播。",
      actionLabel: accepted ? "已采纳正式轨迹 · 点击撤销" : "Accept Candidate (A)",
      actionActive: accepted,
    };
  }
  if (modality.value === "pointcloud-3d") {
    const c = activeCuboid.value;
    const accepted = isActiveCuboidAccepted.value;
    return {
      statusLabel: accepted ? "已采纳 3D 标注" : "投影已同步",
      statusTone: accepted ? "positive" : "ai",
      title: `${c.label} · ${c.distance}`,
      rows: [
        { label: "传感器", value: "LiDAR + CAM_FRONT" },
        { label: "3D 尺寸", value: c.dims },
        { label: "航向投影", value: `Yaw ${formatYaw(c.yawDeg)} · OK`, tone: accepted ? "positive" : "ai" },
      ],
      hint: "点击 BEV 点云立方体，右侧 CAM_FRONT 2D 线框投影实时同步。",
      actionLabel: accepted ? "已采纳 3D 标注 · 点击撤销" : "Accept 3D Cuboid (A)",
      actionActive: accepted,
    };
  }
  const t = activeTrainer.value;
  const deployed = isActiveTrainerDeployed.value;
  return {
    statusLabel: deployed ? "已回流 · 默认预标" : "候选待试用",
    statusTone: deployed ? "positive" : "caution",
    title: t.name,
    rows: [
      { label: "训练协议", value: `${t.protocol} · ${t.license}` },
      { label: `${activeMilestone.value.label} mAP50`, value: `${activeMilestone.value.map50} (${t.delta})`, tone: deployed ? "positive" : "ai" },
      { label: "回流状态", value: deployed ? "项目默认预标已激活" : "等待发布至预标池", tone: deployed ? "positive" : "caution" },
    ],
    hint: deployed
      ? `产物 ${t.artifact} 已回流预标流水线，新批次样本默认调用该模型。`
      : "基于冻结版本 v2.4 完成离线容器训练，发布后即可回流为默认预标。",
    actionLabel: deployed ? "已回流 · 切回候选状态" : "发布为项目默认预标",
    actionActive: deployed,
  };
});

function syncCursorToVehicle(v: VehicleSpec): void {
  const el = canvasStageRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  cursorCoords.value = {
    x: Math.round((v.point.x / 600) * rect.width),
    y: Math.round((v.point.y / 280) * Math.min(rect.height, (rect.width * 280) / 600)),
  };
}

function triggerClickPulse(): void {
  if (reduceMotion.value) return;
  cursorClicking.value = true;
  if (clickTimer) window.clearTimeout(clickTimer);
  clickTimer = window.setTimeout(() => {
    cursorClicking.value = false;
  }, 420);
}

function triggerBoxSpring(): void {
  if (reduceMotion.value) {
    boxTightened.value = true;
    return;
  }
  boxTightened.value = false;
  if (tightenTimer) window.clearTimeout(tightenTimer);
  tightenTimer = window.setTimeout(() => {
    boxTightened.value = true;
  }, 240);
}

function takeManualControl(): void {
  manualControl.value = true;
  if (demoTimer) {
    window.clearInterval(demoTimer);
    demoTimer = undefined;
  }
}

function onSelectModality(next: string | number): void {
  const m = String(next) as HeroModalityId;
  takeManualControl();
  modality.value = m;
  if (m === "image-sam3" && imageSubMode.value === "magic-box") triggerBoxSpring();
  if (m === "video-track" && videoPlaying.value) startVideoLoop();
  else stopVideoLoop();
}

function onSelectImageSubMode(sub: ImageSubMode): void {
  takeManualControl();
  imageSubMode.value = sub;
  if (sub === "magic-box") triggerBoxSpring();
}

function onClickVehicle(v: VehicleSpec): void {
  takeManualControl();
  activeVehicleId.value = v.id;
  syncCursorToVehicle(v);
  triggerClickPulse();
  if (modality.value === "image-sam3" && imageSubMode.value === "magic-box") triggerBoxSpring();
}

function onToggleAcceptVehicle(): void {
  takeManualControl();
  const id = activeVehicleId.value;
  acceptedVehicles.value = { ...acceptedVehicles.value, [id]: !acceptedVehicles.value[id] };
}

function onSelectCuboid(c: Cuboid3DSpec): void {
  takeManualControl();
  activeCuboidId.value = c.id;
}

function onToggleAcceptCuboid(): void {
  takeManualControl();
  const id = activeCuboidId.value;
  acceptedCuboids.value = { ...acceptedCuboids.value, [id]: !acceptedCuboids.value[id] };
}

function onSelectTrainer(id: TrainerId): void {
  takeManualControl();
  activeTrainerId.value = id;
  activeEpochId.value = "E50";
}

function onSelectEpoch(id: EpochId): void {
  takeManualControl();
  activeEpochId.value = id;
}

function onToggleDeployModel(): void {
  takeManualControl();
  deployedTrainerId.value = deployedTrainerId.value === activeTrainerId.value ? null : activeTrainerId.value;
}

function onInspectorPrimaryAction(): void {
  if (modality.value === "image-sam3" || modality.value === "video-track") onToggleAcceptVehicle();
  else if (modality.value === "pointcloud-3d") onToggleAcceptCuboid();
  else onToggleDeployModel();
}

function onScrubFrame(frame: number): void {
  takeManualControl();
  videoPlaying.value = false;
  stopVideoLoop();
  videoFrame.value = frame;
}

function toggleVideoPlay(): void {
  takeManualControl();
  videoPlaying.value = !videoPlaying.value;
  if (videoPlaying.value) startVideoLoop();
  else stopVideoLoop();
}

function startVideoLoop(): void {
  stopVideoLoop();
  if (reduceMotion.value) return;
  frameTimer = window.setInterval(() => {
    videoFrame.value = (videoFrame.value + 1) % (TOTAL_FRAMES + 1);
  }, 240);
}

function stopVideoLoop(): void {
  if (frameTimer) {
    window.clearInterval(frameTimer);
    frameTimer = undefined;
  }
}

function runAutoStep(): void {
  const script: Array<() => void> = [
    () => {
      stopVideoLoop();
      modality.value = "image-sam3";
      imageSubMode.value = "smart-point";
      activeVehicleId.value = "v1";
      syncCursorToVehicle(VEHICLES[0]);
      triggerClickPulse();
    },
    () => {
      modality.value = "image-sam3";
      imageSubMode.value = "magic-box";
      activeVehicleId.value = "v3";
      syncCursorToVehicle(VEHICLES[2]);
      triggerClickPulse();
      triggerBoxSpring();
    },
    () => {
      modality.value = "video-track";
      videoPlaying.value = true;
      startVideoLoop();
    },
    () => {
      stopVideoLoop();
      modality.value = "pointcloud-3d";
      activeCuboidId.value = "c1";
    },
    () => {
      modality.value = "pointcloud-3d";
      activeCuboidId.value = "c2";
    },
    () => {
      modality.value = "online-learning";
      activeTrainerId.value = "ultralytics";
      activeEpochId.value = "E50";
    },
  ];
  script[demoStep % script.length]();
  demoStep++;
}

function resumeAutoplay(): void {
  manualControl.value = false;
  if (demoTimer) window.clearInterval(demoTimer);
  if (reduceMotion.value) return;
  runAutoStep();
  demoTimer = window.setInterval(runAutoStep, 3400);
}

onMounted(() => {
  reduceMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  syncCursorToVehicle(VEHICLES[0]);
  if (!reduceMotion.value) {
    demoStep = 1;
    demoTimer = window.setInterval(runAutoStep, 3400);
  }
});

onBeforeUnmount(() => {
  if (demoTimer) window.clearInterval(demoTimer);
  if (tightenTimer) window.clearTimeout(tightenTimer);
  if (clickTimer) window.clearTimeout(clickTimer);
  stopVideoLoop();
});
</script>

<template>
  <div
    class="yoao-ui yoao-demo relative overflow-hidden rounded-[var(--yoao-radius-lg)] border border-border-strong bg-surface/95 shadow-[var(--yoao-shadow-frame)] backdrop-blur-md"
    data-hero-simulator
  >
    <div class="flex flex-wrap items-center justify-between gap-2.5 border-b border-divider bg-surface-alt/80 px-3.5 py-2.5 sm:px-4">
      <div class="flex items-center gap-2.5">
        <span class="flex items-center gap-1.5" aria-hidden="true">
          <i class="block size-2 rounded-full border border-border-strong bg-bg"></i>
          <i class="block size-2 rounded-full border border-border-strong bg-bg"></i>
          <i class="block size-2 rounded-full border border-border-strong bg-bg"></i>
        </span>
        <span class="font-mono text-[11px] tracking-[0.06em] text-fg-muted uppercase">YOAO Workbench</span>
      </div>

      <TabsRoot :model-value="modality" @update:model-value="onSelectModality">
        <TabsList
          class="relative flex flex-wrap items-center gap-1 rounded-[var(--yoao-radius)] border border-border bg-bg p-0.5"
          aria-label="多模态工作台演示模式"
        >
          <TabsTrigger
            v-for="item in MODALITIES"
            :key="item.id"
            :value="item.id"
            :data-modality-tab="item.id"
            class="relative inline-flex items-center gap-1.5 rounded-[var(--yoao-radius-sm)] px-2 py-1 text-[11.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-2.5 sm:text-[12px]"
            :class="modality === item.id ? 'text-fg' : 'text-fg-muted hover:text-fg'"
          >
            <Motion
              v-if="modality === item.id"
              layout-id="hero-modality-pill"
              class="absolute inset-0 rounded-[var(--yoao-radius-sm)] border border-border bg-surface-alt shadow-[var(--yoao-shadow-sm)]"
              :transition="reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }"
            />
            <component
              :is="item.icon"
              class="relative z-10 size-3.5 shrink-0"
              :class="modality === item.id ? 'text-ai' : 'text-fg-subtle'"
            />
            <span class="relative z-10 whitespace-nowrap">{{ item.label }}</span>
          </TabsTrigger>
        </TabsList>
      </TabsRoot>

      <div class="flex items-center gap-2">
        <button
          v-if="manualControl"
          type="button"
          data-resume-demo
          class="inline-flex items-center gap-1 rounded-full border border-ai-border bg-ai-soft px-2.5 py-1 font-mono text-[10.5px] font-medium text-ai transition-colors hover:brightness-95"
          @click="resumeAutoplay"
        >
          <RotateCcw class="size-3" />
          <span>手动交互中 · 恢复演示</span>
        </button>
        <span
          v-else
          class="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 font-mono text-[10.5px] text-fg-muted"
        >
          <span class="size-1.5 rounded-full bg-ai-solid"></span>
          <span>{{ activeModalityMeta.prompt }}</span>
        </span>
      </div>
    </div>

    <div class="grid md:grid-cols-[168px_minmax(0,1fr)_252px]">
      <aside class="hidden flex-col justify-between border-r border-divider bg-surface p-3.5 md:flex">
        <div>
          <div class="mb-2.5 font-mono text-[10px] tracking-[0.08em] text-fg-subtle uppercase">
            {{ sidebarModel.heading }}
          </div>
          <div class="flex flex-col gap-1">
            <button
              v-for="item in sidebarModel.items"
              :key="item.id"
              type="button"
              class="flex items-center justify-between rounded-[var(--yoao-radius-sm)] px-2 py-1.5 text-left text-[12px] transition-colors"
              :class="item.active ? item.activeClass : 'text-fg-muted hover:bg-surface-hover'"
              @click="item.select"
            >
              <span class="flex items-center gap-1.5">
                <span class="size-1.5 rounded-full" :class="item.dotClass"></span>
                <span>{{ item.label }}</span>
              </span>
              <span class="font-mono text-[10px] text-fg-subtle">{{ item.meta }}</span>
            </button>
          </div>
        </div>

        <div class="rounded-[var(--yoao-radius-sm)] border border-divider bg-bg-subtle p-2.5 font-mono text-[10px]">
          <div class="flex items-center justify-between text-fg-subtle">
            <span>{{ sidebarModel.footA[0] }}</span>
            <span class="text-fg">{{ sidebarModel.footA[1] }}</span>
          </div>
          <div class="mt-1.5 flex items-center justify-between text-fg-subtle">
            <span>{{ sidebarModel.footB[0] }}</span>
            <span :class="sidebarModel.footB[2]">{{ sidebarModel.footB[1] }}</span>
          </div>
        </div>
      </aside>

      <div
        ref="canvasStageRef"
        class="relative flex min-w-0 flex-col justify-between bg-bg-subtle"
        style="background-image: var(--yoao-signature-gradient)"
      >
        <template v-if="modality === 'image-sam3' || modality === 'video-track'">
          <div class="relative flex-1 overflow-hidden">
            <svg
              viewBox="0 0 600 280"
              class="block h-full w-full select-none"
              role="img"
              :aria-label="modality === 'image-sam3' ? '可交互图像 SAM3 标注画布' : '可交互视频轨迹跟踪画布'"
            >
              <path d="M0 62L600 62M0 228L600 228" stroke="var(--yoao-rail)" stroke-width="1" />
              <path d="M0 144L600 144" stroke="var(--yoao-rail-strong)" stroke-width="1" stroke-dasharray="10 10" />
              <path d="M120 0V280M300 0V280M480 0V280" stroke="var(--yoao-divider)" stroke-width="0.75" opacity="0.55" />

              <text
                v-if="modality === 'video-track'"
                x="14"
                y="24"
                fill="var(--yoao-fg-subtle)"
                font-size="9.5"
                font-family="var(--docs-font-mono)"
              >
                TRACK · F{{ String(videoFrame).padStart(2, "0") }} / F{{ TOTAL_FRAMES }} · {{ frameKindLabel }}
              </text>

              <line
                v-if="modality === 'image-sam3' && imageSubMode === 'exemplar'"
                x1="0"
                x2="600"
                y1="140"
                y2="140"
                stroke="var(--yoao-ai-solid)"
                stroke-width="1"
                stroke-dasharray="4 6"
                opacity="0.45"
              />

              <g
                v-for="item in renderedVehicles"
                :key="item.vehicle.id"
                :data-vehicle-id="item.vehicle.id"
                :transform="`translate(${item.offset.dx}, ${item.offset.dy})`"
                class="cursor-pointer"
                :class="reduceMotion ? '' : 'transition-transform duration-200 ease-out'"
                @click="onClickVehicle(item.vehicle)"
              >
                <path
                  v-if="modality === 'video-track'"
                  :d="`M${item.vehicle.point.x - 42} ${item.vehicle.point.y - 5}L${item.vehicle.point.x + 42} ${item.vehicle.point.y + 5}`"
                  :stroke="item.palette.stroke"
                  stroke-width="1.25"
                  :class="reduceMotion ? '' : 'yoao-dash-flow'"
                  opacity="0.7"
                />
                <rect
                  :x="item.vehicle.box.x + 4"
                  :y="item.vehicle.box.y + 4"
                  :width="item.vehicle.box.w - 8"
                  :height="item.vehicle.box.h - 8"
                  rx="7"
                  fill="var(--yoao-surface)"
                  stroke="var(--yoao-border-strong)"
                  stroke-width="1.2"
                />
                <rect
                  :x="item.vehicle.box.x + 16"
                  :y="item.vehicle.box.y + 10"
                  :width="item.vehicle.box.w - 32"
                  :height="item.vehicle.box.h - 20"
                  rx="4"
                  fill="var(--yoao-surface-alt)"
                  stroke="var(--yoao-divider)"
                  stroke-width="1"
                />

                <template
                  v-if="modality === 'image-sam3' && imageSubMode === 'smart-point' && (activeVehicleId === item.vehicle.id || item.accepted)"
                >
                  <polygon :points="item.vehicle.poly" :fill="item.palette.fill" :stroke="item.palette.stroke" stroke-width="1.8" />
                  <circle
                    v-if="activeVehicleId === item.vehicle.id && !item.accepted"
                    :cx="item.vehicle.point.x"
                    :cy="item.vehicle.point.y"
                    r="7"
                    fill="none"
                    stroke="var(--yoao-ai-solid)"
                    stroke-width="1.5"
                    :class="reduceMotion ? '' : 'yoao-pulse-ring'"
                  />
                  <circle
                    v-if="activeVehicleId === item.vehicle.id"
                    :cx="item.vehicle.point.x"
                    :cy="item.vehicle.point.y"
                    r="4"
                    :fill="item.palette.stroke"
                    stroke="var(--yoao-bg)"
                    stroke-width="1.5"
                  />
                </template>

                <rect
                  v-if="item.overlayBox"
                  :x="item.overlayBox.x"
                  :y="item.overlayBox.y"
                  :width="item.overlayBox.w"
                  :height="item.overlayBox.h"
                  rx="4"
                  :fill="item.palette.fill"
                  :stroke="item.palette.stroke"
                  stroke-width="1.75"
                  :stroke-dasharray="item.overlayBox.dashed ? '5 4' : undefined"
                  :class="reduceMotion ? '' : 'transition-all duration-300 ease-out'"
                />

                <g v-if="item.showPill">
                  <rect :x="item.vehicle.box.x" :y="item.vehicle.box.y - 21" width="102" height="17" rx="4" :fill="item.palette.stroke" />
                  <text
                    :x="item.vehicle.box.x + 6"
                    :y="item.vehicle.box.y - 9.5"
                    fill="var(--yoao-paper-white)"
                    font-size="9.5"
                    font-family="var(--docs-font-mono)"
                    font-weight="600"
                  >
                    {{ item.pillText }}
                  </text>
                </g>
              </g>
            </svg>

            <DemoCursor
              :x="cursorCoords.x"
              :y="cursorCoords.y"
              :visible="!manualControl && !reduceMotion && modality === 'image-sam3'"
              :clicking="cursorClicking"
            />
          </div>

          <div
            v-if="modality === 'image-sam3'"
            class="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-surface px-3.5 py-2"
          >
            <div class="flex flex-wrap items-center gap-1">
              <button
                v-for="sub in IMAGE_SUB_MODES"
                :key="sub.id"
                type="button"
                :data-image-submode="sub.id"
                class="inline-flex items-center gap-1 rounded-[var(--yoao-radius-sm)] border px-2 py-1 text-[11px] font-medium transition-colors"
                :class="
                  imageSubMode === sub.id
                    ? 'border-ai-border bg-ai-soft text-ai'
                    : 'border-border bg-bg text-fg-muted hover:border-border-strong hover:text-fg'
                "
                @click="onSelectImageSubMode(sub.id)"
              >
                <component :is="sub.icon" class="size-3" />
                <span>{{ sub.label }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="hidden font-mono text-[10.5px] text-fg-subtle sm:inline">
                {{ activeVehicle.label }} · {{ isActiveVehicleAccepted ? "已采纳正式标注" : "AI 候选" }}
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-[var(--yoao-radius-sm)] border px-2 py-1 text-[11px] font-medium md:hidden"
                :class="
                  isActiveVehicleAccepted
                    ? 'border-positive-border bg-positive-soft text-positive'
                    : 'border-border bg-surface-alt text-fg'
                "
                @click="onToggleAcceptVehicle"
              >
                <Check class="size-3" />
                <span>{{ isActiveVehicleAccepted ? "已采纳" : "Accept (A)" }}</span>
              </button>
            </div>
          </div>

          <div v-else class="flex items-center gap-2.5 border-t border-divider bg-surface px-3.5 py-2">
            <button
              type="button"
              data-video-play-toggle
              class="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--yoao-radius-sm)] border border-border bg-surface-alt text-fg hover:bg-surface-hover"
              :aria-label="videoPlaying ? '暂停时间轴' : '播放时间轴'"
              @click="toggleVideoPlay"
            >
              <Pause v-if="videoPlaying" class="size-3.5 text-ai" />
              <Play v-else class="size-3.5 text-ai" />
            </button>
            <div class="flex flex-1 items-center gap-0.5 overflow-hidden sm:gap-1">
              <button
                v-for="f in TOTAL_FRAMES + 1"
                :key="f - 1"
                type="button"
                :data-video-frame="f - 1"
                class="relative flex h-6 flex-1 items-center justify-center rounded-[2px] transition-colors"
                :class="videoFrame === f - 1 ? 'bg-ai-soft' : 'hover:bg-surface-hover'"
                :aria-label="`跳转到第 ${f - 1} 帧`"
                @click="onScrubFrame(f - 1)"
              >
                <span
                  class="block rounded-full"
                  :class="
                    AI_KEYFRAMES.has(f - 1)
                      ? 'size-2 bg-ai-solid'
                      : MANUAL_KEYFRAMES.has(f - 1)
                        ? 'size-2 bg-fg'
                        : 'h-2.5 w-px bg-divider'
                  "
                ></span>
                <span v-if="videoFrame === f - 1" class="absolute inset-y-0.5 w-0.5 bg-fg"></span>
              </button>
            </div>
            <span class="shrink-0 font-mono text-[10.5px] text-fg-muted tabular-nums" data-video-readout>
              F{{ String(videoFrame).padStart(2, "0") }}
            </span>
          </div>
        </template>

        <template v-else-if="modality === 'pointcloud-3d'">
          <div class="relative flex-1 overflow-hidden">
            <svg
              viewBox="0 0 600 280"
              class="block h-full w-full select-none"
              role="img"
              aria-label="LiDAR BEV 点云与前视相机 2D 投影联动画布"
            >
              <path d="M192 22V262M16 146H368" stroke="var(--yoao-divider)" stroke-width="0.75" opacity="0.55" />
              <path
                d="M132 216A68 68 0 0 1 252 216M72 192A132 132 0 0 1 312 192M12 174A194 194 0 0 1 372 174"
                fill="none"
                stroke="var(--yoao-rail)"
                stroke-width="1"
              />
              <path :d="BEV_SPARSE_DOT_PATH" fill="none" stroke="var(--yoao-fg-subtle)" stroke-width="2" stroke-linecap="round" opacity="0.34" />
              <path :d="BEV_ROAD_DOT_PATH" fill="none" stroke="var(--yoao-fg-muted)" stroke-width="2.2" stroke-linecap="round" opacity="0.52" />
              <path :d="BEV_OBJECT_DOT_PATH" fill="none" stroke="var(--yoao-ai-solid)" stroke-width="2.6" stroke-linecap="round" opacity="0.72" />
              <text x="14" y="22" fill="var(--yoao-fg-subtle)" font-size="9.5" font-family="var(--docs-font-mono)">
                LIDAR_TOP · BEV · 32-CH
              </text>

              <polygon points="192,236 184,254 192,250 200,254" fill="var(--yoao-surface)" stroke="var(--yoao-fg-muted)" stroke-width="1.2" />
              <text x="182" y="269" fill="var(--yoao-fg-subtle)" font-size="8.5" font-family="var(--docs-font-mono)">EGO</text>

              <g
                v-for="c in CUBOIDS_3D"
                :key="c.id"
                :data-cuboid-id="c.id"
                class="cursor-pointer"
                @click="onSelectCuboid(c)"
              >
                <g :transform="`translate(${c.bev.cx}, ${c.bev.cy}) rotate(${c.yawDeg})`">
                  <rect
                    :x="-c.bev.w / 2"
                    :y="-c.bev.h / 2"
                    :width="c.bev.w"
                    :height="c.bev.h"
                    rx="3"
                    :fill="cuboidBevPalette(c).fill"
                    :stroke="cuboidBevPalette(c).stroke"
                    :stroke-width="cuboidBevPalette(c).width"
                  />
                  <path
                    :d="`M0 ${-c.bev.h / 2}V${-c.bev.h / 2 - 14}M-4 ${-c.bev.h / 2 - 9}L0 ${-c.bev.h / 2 - 14}L4 ${-c.bev.h / 2 - 9}`"
                    fill="none"
                    :stroke="cuboidBevPalette(c).arrow"
                    stroke-width="1.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                <text
                  :x="c.bev.cx - 24"
                  :y="c.bev.cy + c.bev.h / 2 + 13"
                  :fill="cuboidBevPalette(c).text"
                  font-size="9"
                  font-family="var(--docs-font-mono)"
                  font-weight="600"
                >
                  {{ c.label }}
                </text>
              </g>

              <line x1="384" y1="0" x2="384" y2="280" stroke="var(--yoao-divider)" stroke-width="1" />
              <rect x="394" y="14" width="196" height="252" rx="8" fill="var(--yoao-surface)" stroke="var(--yoao-border)" stroke-width="1" />
              <path d="M394 40H590M394 242H590" stroke="var(--yoao-divider)" stroke-width="1" />
              <circle cx="406" cy="27" r="3" fill="var(--yoao-positive-solid)" />
              <text x="415" y="30" fill="var(--yoao-fg-muted)" font-size="9" font-family="var(--docs-font-mono)" font-weight="600">
                CAM_FRONT · 2D Projection
              </text>
              <path
                d="M398 112H586M492 112L404 234M492 112L456 234M492 112L528 234M492 112L580 234"
                fill="none"
                stroke="var(--yoao-rail)"
                stroke-width="0.9"
              />

              <rect
                v-for="c in ghostCuboids"
                :key="`cam-${c.id}`"
                :x="c.cam2d.x"
                :y="c.cam2d.y"
                :width="c.cam2d.w"
                :height="c.cam2d.h"
                rx="2"
                fill="var(--yoao-surface-alt)"
                stroke="var(--yoao-border)"
                stroke-width="1"
                stroke-dasharray="3 3"
                class="cursor-pointer"
                @click="onSelectCuboid(c)"
              />

              <g data-cam-projection>
                <rect
                  :x="activeCuboid.cam2d.x + activeCuboid.cam2d.dx"
                  :y="activeCuboid.cam2d.y + activeCuboid.cam2d.dy"
                  :width="activeCuboid.cam2d.w"
                  :height="activeCuboid.cam2d.h"
                  rx="2"
                  fill="none"
                  :stroke="activeCuboidColor.stroke"
                  stroke-width="1.1"
                  stroke-dasharray="3 2"
                  opacity="0.75"
                />
                <path :d="projectedWireframeEdges(activeCuboid)" fill="none" :stroke="activeCuboidColor.stroke" stroke-width="1.1" opacity="0.75" />
                <rect
                  :x="activeCuboid.cam2d.x"
                  :y="activeCuboid.cam2d.y"
                  :width="activeCuboid.cam2d.w"
                  :height="activeCuboid.cam2d.h"
                  rx="2"
                  :fill="activeCuboidColor.fill"
                  :stroke="activeCuboidColor.stroke"
                  stroke-width="1.75"
                />
                <rect :x="Math.min(activeCuboid.cam2d.x, 488)" :y="activeCuboid.cam2d.y - 19" width="94" height="15" rx="3" :fill="activeCuboidColor.stroke" />
                <text
                  :x="Math.min(activeCuboid.cam2d.x, 488) + 5"
                  :y="activeCuboid.cam2d.y - 8.5"
                  fill="var(--yoao-paper-white)"
                  font-size="8.5"
                  font-family="var(--docs-font-mono)"
                  font-weight="600"
                >
                  {{ activeCuboid.label }} · {{ formatYaw(activeCuboid.yawDeg) }}
                </text>
              </g>

              <text x="404" y="257" fill="var(--yoao-fg-subtle)" font-size="8.5" font-family="var(--docs-font-mono)" data-cam-sync-label>
                SYNC · {{ activeCuboid.label }} · {{ activeCuboid.distance }}
              </text>
            </svg>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-surface px-3.5 py-2">
            <div class="flex flex-wrap items-center gap-1">
              <button
                v-for="c in CUBOIDS_3D"
                :key="`pill-${c.id}`"
                type="button"
                :data-cuboid-pill="c.id"
                class="inline-flex items-center gap-1.5 rounded-[var(--yoao-radius-sm)] border px-2 py-1 font-mono text-[11px] transition-colors"
                :class="
                  activeCuboidId === c.id
                    ? isCuboidAccepted(c.id)
                      ? 'border-positive-border bg-positive-soft text-positive'
                      : 'border-ai-border bg-ai-soft text-ai'
                    : 'border-border bg-bg text-fg-muted hover:border-border-strong hover:text-fg'
                "
                @click="onSelectCuboid(c)"
              >
                <span>{{ c.label }}</span>
                <span class="text-[10px] opacity-75">{{ formatYaw(c.yawDeg) }}</span>
              </button>
            </div>
            <span class="font-mono text-[10.5px] text-fg-subtle">LiDAR ↔ CAM_FRONT · {{ activeCuboid.dims }}</span>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-1 flex-col justify-between gap-3 p-3.5 sm:p-4">
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-[var(--yoao-radius-sm)] border border-divider bg-surface px-3 py-2 font-mono text-[10.5px]">
              <span class="inline-flex items-center gap-1.5 text-fg">
                <span class="size-1.5 rounded-full bg-positive-solid" aria-hidden="true"></span>
                <span>v2.4 · 1,280 已审样本 · SHA-256 已核验</span>
              </span>
              <span class="rounded-full border border-positive-border bg-positive-soft px-2 py-0.5 text-[10px] text-positive">
                input_membership OK
              </span>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-for="t in TRAINERS"
                  :key="t.id"
                  type="button"
                  :data-trainer-id="t.id"
                  class="rounded-[var(--yoao-radius-sm)] border px-2.5 py-1 text-[11.5px] font-medium transition-colors"
                  :class="
                    activeTrainerId === t.id
                      ? 'border-ai-border bg-ai-soft text-ai'
                      : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                  "
                  @click="onSelectTrainer(t.id)"
                >
                  {{ t.name }}
                </button>
              </div>
              <div class="flex items-center gap-2 font-mono text-[11.5px]">
                <span class="text-fg-subtle">mAP50</span>
                <span class="font-semibold text-fg tabular-nums" data-trainer-map>{{ activeTrainer.map50 }}</span>
                <span class="rounded-full border border-positive-border bg-positive-soft px-1.5 py-0.5 text-[10px] text-positive tabular-nums">
                  {{ activeTrainer.delta }}
                </span>
              </div>
            </div>

            <div class="rounded-[var(--yoao-radius-sm)] border border-divider bg-surface p-2.5">
              <div class="mb-1 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-fg-subtle">
                <span>{{ activeTrainer.protocol }} · {{ activeMilestone.label }} · loss {{ activeMilestone.loss }}</span>
                <span class="text-fg-muted">{{ activeMilestone.note }}</span>
              </div>
              <svg viewBox="0 0 460 124" class="block h-[112px] w-full select-none" role="img" aria-label="在线训练 mAP50 曲线">
                <path d="M36 24H440M36 68H440M36 112H440" stroke="var(--yoao-divider)" stroke-width="0.75" pointer-events="none" />
                <line x1="36" :y1="activeTrainer.baselineY" x2="440" :y2="activeTrainer.baselineY" stroke="var(--yoao-rail-strong)" stroke-width="1" stroke-dasharray="4 4" pointer-events="none" />
                <text x="38" :y="activeTrainer.baselineY - 4" fill="var(--yoao-fg-subtle)" font-size="8.5" font-family="var(--docs-font-mono)" pointer-events="none">
                  {{ activeTrainer.baselineLabel }}
                </text>
                <path :d="activeTrainer.areaPath" :fill="isActiveTrainerDeployed ? 'var(--yoao-positive-soft)' : 'var(--yoao-ai-soft)'" opacity="0.65" pointer-events="none" />
                <path :d="activeTrainer.curvePath" fill="none" :stroke="isActiveTrainerDeployed ? 'var(--yoao-positive-solid)' : 'var(--yoao-ai-solid)'" stroke-width="2" stroke-linecap="round" pointer-events="none" />
                <g
                  v-for="m in activeTrainer.milestones"
                  :key="m.id"
                  :data-epoch-id="m.id"
                  class="cursor-pointer"
                  @click="onSelectEpoch(m.id)"
                >
                  <rect :x="m.x - 26" y="8" width="52" height="114" fill="transparent" />
                  <circle
                    :cx="m.x"
                    :cy="m.y"
                    :r="activeEpochId === m.id ? 6 : 4"
                    :fill="activeEpochId === m.id ? (isActiveTrainerDeployed ? 'var(--yoao-positive-solid)' : 'var(--yoao-ai-solid)') : 'var(--yoao-surface)'"
                    :stroke="isActiveTrainerDeployed ? 'var(--yoao-positive-solid)' : 'var(--yoao-ai-solid)'"
                    stroke-width="1.8"
                  />
                  <text
                    :x="m.x"
                    y="122"
                    text-anchor="middle"
                    :fill="activeEpochId === m.id ? 'var(--yoao-fg)' : 'var(--yoao-fg-subtle)'"
                    font-size="9"
                    font-family="var(--docs-font-mono)"
                    :font-weight="activeEpochId === m.id ? '600' : '400'"
                  >
                    {{ m.label }}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-surface px-3.5 py-2">
            <div class="flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
              <span
                class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
                :class="isActiveTrainerDeployed ? STATUS_BADGE_CLASS.positive : STATUS_BADGE_CLASS.caution"
                data-model-return-status
              >
                <span class="size-1.5 rounded-full" :class="isActiveTrainerDeployed ? 'bg-positive-solid' : 'bg-caution-solid'"></span>
                <span>{{ isActiveTrainerDeployed ? "已回流 · 默认预标" : "候选待试用" }}</span>
              </span>
              <span class="text-fg-subtle">{{ activeTrainer.artifact }}</span>
            </div>
            <button
              type="button"
              data-deploy-model
              class="inline-flex items-center gap-1.5 rounded-[var(--yoao-radius-sm)] border px-2.5 py-1 text-[11px] font-medium transition-colors"
              :class="
                isActiveTrainerDeployed
                  ? 'border-border bg-surface-alt text-fg-muted hover:text-fg'
                  : 'border-positive-border bg-positive-soft text-positive hover:brightness-95'
              "
              @click="onToggleDeployModel"
            >
              <Check class="size-3" />
              <span>{{ isActiveTrainerDeployed ? "撤回默认预标" : "发布为项目默认预标" }}</span>
            </button>
          </div>
        </template>
      </div>

      <aside class="hidden flex-col justify-between border-l border-divider bg-surface p-3.5 md:flex">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[10px] tracking-[0.08em] text-fg-subtle uppercase">Inspector</span>
            <span
              class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px]"
              :class="STATUS_BADGE_CLASS[inspectorModel.statusTone]"
              data-inspector-status
            >
              <Check v-if="inspectorModel.statusTone === 'positive'" class="size-2.5" />
              <Sparkle v-else class="size-2.5" />
              <span>{{ inspectorModel.statusLabel }}</span>
            </span>
          </div>

          <div class="rounded-[var(--yoao-radius-sm)] border border-divider bg-bg-subtle p-2.5">
            <div class="text-[12.5px] font-semibold text-fg" data-inspector-title>{{ inspectorModel.title }}</div>
            <dl class="mt-2 grid gap-1.5 font-mono text-[10.5px]">
              <div v-for="row in inspectorModel.rows" :key="row.label" class="flex justify-between gap-2.5">
                <dt class="shrink-0 whitespace-nowrap text-fg-subtle">{{ row.label }}</dt>
                <dd class="text-right" :class="row.tone ? VALUE_TONE_CLASS[row.tone] : 'text-fg'">{{ row.value }}</dd>
              </div>
            </dl>
          </div>

          <p class="text-[12px] leading-relaxed text-fg-muted">{{ inspectorModel.hint }}</p>
        </div>

        <button
          type="button"
          data-inspector-action
          class="flex w-full items-center justify-center gap-1.5 rounded-[var(--yoao-radius-sm)] border px-2.5 py-2 text-[11.5px] font-medium transition-colors"
          :class="
            inspectorModel.actionActive
              ? 'border-border bg-surface-alt text-fg-muted hover:border-border-strong hover:text-fg'
              : 'border-positive-border bg-positive-soft text-positive hover:brightness-95'
          "
          @click="onInspectorPrimaryAction"
        >
          <Check class="size-3.5" />
          <span>{{ inspectorModel.actionLabel }}</span>
        </button>
      </aside>
    </div>
  </div>
</template>
