import rawHomeStats from "../../generated/home-stats.generated.json";

export type HomeSectionKey = "hero" | "proof" | "flow" | "ecosystem" | "paths" | "closing";

export interface HomeSectionMeta {
  readonly id: HomeSectionKey;
  readonly no: "01" | "02" | "03" | "04" | "05" | "06";
  readonly kicker: string;
}

export const HOME_SECTIONS = {
  hero: { id: "hero", no: "01", kicker: "01 / 多模态数据工作台" },
  proof: { id: "proof", no: "02", kicker: "02 / 实机验证场景" },
  flow: { id: "flow", no: "03", kicker: "03 / 数据与在线学习闭环" },
  ecosystem: { id: "ecosystem", no: "04", kicker: "04 / 插件生态与开发者接口" },
  paths: { id: "paths", no: "05", kicker: "05 / 选择文档入口" },
  closing: { id: "closing", no: "06", kicker: "06 / 开始构建" },
} as const satisfies Record<HomeSectionKey, HomeSectionMeta>;

export type HeroModalityId =
  | "image-sam3"
  | "video-track"
  | "pointcloud-3d"
  | "online-learning";

export interface HeroModalityMeta {
  readonly id: HeroModalityId;
  readonly label: string;
  readonly short: string;
  readonly badge: string;
  readonly summary: string;
}

export interface ProofMediaClip {
  readonly id: string;
  readonly no: string;
  readonly name: string;
  readonly kicker: string;
  readonly desc: string;
  readonly meta: string;
  readonly src: string;
  readonly fallbackSrc?: string;
  readonly poster: string;
  readonly alt: string;
}

export interface ProofSceneBase {
  readonly id: string;
  readonly no: string;
  readonly kicker: string;
  readonly title: string;
  readonly desc: string;
  readonly href: string;
  readonly ctaLabel?: string;
}

export type ProofScene =
  | (ProofSceneBase & {
      readonly kind: "carousel";
      readonly clips: readonly [ProofMediaClip, ...ProofMediaClip[]];
    })
  | (ProofSceneBase & {
      readonly kind: "video";
      readonly clip: ProofMediaClip;
      readonly alternateClips?: readonly ProofMediaClip[];
    })
  | (ProofSceneBase & {
      readonly kind: "image";
      readonly src: string;
      readonly meta: string;
      readonly alt: string;
    });

export type LoopStageTone = "neutral" | "ai" | "accent" | "positive" | "caution" | "info";

export interface LoopStage {
  readonly no: string;
  readonly title: string;
  readonly desc: string;
  readonly status: string;
  readonly tone: LoopStageTone;
  readonly source: string;
  readonly format: string;
  readonly audit: string;
  readonly evidenceBadges: readonly string[];
  readonly href: string;
  readonly ctaLabel: string;
  readonly returnsToStage?: string;
}

export type ExtensionPointId =
  | "inference"
  | "trainer"
  | "notification_channel"
  | "format_adapter"
  | "theme";

export interface ExtensionPointPluginRef {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly href: string;
}

export interface ExtensionPointSpec {
  readonly id: ExtensionPointId;
  readonly label: string;
  readonly protocol: string;
  readonly runtime: string;
  readonly description: string;
  readonly officialCount: number;
  readonly plugins: readonly ExtensionPointPluginRef[];
  readonly protocolHref: string;
  readonly manageHref: string;
}

export type DevSnippetTabId = "cli" | "python-sdk" | "plugin-sdk" | "agent-streams";

export interface DevSnippetSpec {
  readonly id: DevSnippetTabId;
  readonly label: string;
  readonly language: "bash" | "python" | "json";
  readonly summary: string;
  readonly command: string;
  readonly output: string;
  readonly docLabel: string;
  readonly docHref: string;
}

export type DocPathIconKey = "workbench" | "datasets" | "plugins" | "api" | "ops" | "dev";

export interface DocPathSubLink {
  readonly label: string;
  readonly href: string;
}

export interface DocPathCard {
  readonly no: string;
  readonly title: string;
  readonly desc: string;
  readonly link: string;
  readonly href: string;
  readonly iconKey: DocPathIconKey;
  readonly subLinks: readonly DocPathSubLink[];
}

export interface OfficialPluginCounts {
  readonly total: number;
  readonly inference: number;
  readonly trainer: number;
  readonly notificationChannel: number;
  readonly formatAdapter: number;
}

export interface HomeStats {
  readonly apiRoutes: number;
  readonly apiModules: number;
  readonly docPages: number;
  readonly extensionPoints: number;
  readonly extensionPointIds: readonly ExtensionPointId[];
  readonly officialPlugins: OfficialPluginCounts;
}

const VALID_EXTENSION_POINT_IDS = new Set<string>([
  "inference",
  "trainer",
  "notification_channel",
  "format_adapter",
  "theme",
]);

function isExtensionPointId(value: string): value is ExtensionPointId {
  return VALID_EXTENSION_POINT_IDS.has(value);
}

function parseHomeStats(raw: typeof rawHomeStats): HomeStats {
  const extensionPointIds: ExtensionPointId[] = [];
  for (const id of raw.extensionPointIds) {
    if (!isExtensionPointId(id)) {
      throw new Error(`Invalid extension point id in home-stats.generated.json: ${id}`);
    }
    extensionPointIds.push(id);
  }
  return {
    apiRoutes: raw.apiRoutes,
    apiModules: raw.apiModules,
    docPages: raw.docPages,
    extensionPoints: raw.extensionPoints,
    extensionPointIds,
    officialPlugins: {
      total: raw.officialPlugins.total,
      inference: raw.officialPlugins.inference,
      trainer: raw.officialPlugins.trainer,
      notificationChannel: raw.officialPlugins.notificationChannel,
      formatAdapter: raw.officialPlugins.formatAdapter,
    },
  };
}

export const HOME_STATS: HomeStats = parseHomeStats(rawHomeStats);
