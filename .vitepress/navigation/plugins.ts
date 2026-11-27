import type { DefaultTheme } from "vitepress";

export const pluginsSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: "插件生态",
    items: [
      { text: "概览", link: "/plugins/" },
      { text: "官方插件目录", link: "/plugins/official/" },
    ],
  },
  {
    text: "官方推理插件",
    collapsed: false,
    items: [
      { text: "Ultralytics YOLO", link: "/plugins/official/inference/yolo" },
      { text: "Grounded-SAM2", link: "/plugins/official/inference/grounded-sam2" },
      { text: "SAM3", link: "/plugins/official/inference/sam3" },
      { text: "LibreYOLO", link: "/plugins/official/inference/libreyolo" },
      { text: "RapidOCR", link: "/plugins/official/inference/rapidocr" },
      { text: "ONNXTools", link: "/plugins/official/inference/onnxtools" },
    ],
  },
  {
    text: "官方训练器插件",
    collapsed: false,
    items: [
      { text: "Ultralytics", link: "/plugins/official/trainer/ultralytics" },
      { text: "LibreYOLO", link: "/plugins/official/trainer/libreyolo" },
    ],
  },
  {
    text: "官方通知与格式插件",
    collapsed: false,
    items: [
      { text: "飞书私信通知渠道", link: "/plugins/official/notification-channel/feishu-dm" },
      { text: "LabelMe JSON 格式适配", link: "/plugins/official/format-adapter/labelme-json" },
    ],
  },
  {
    text: "安装与运行管理",
    collapsed: false,
    items: [
      { text: "安装与管理概览", link: "/plugins/manage/" },
      { text: "安装官方与自定义推理插件", link: "/plugins/manage/inference-install" },
      { text: "注册与启用训练器插件", link: "/plugins/manage/trainer-install" },
      { text: "历史清单与本地收据迁移", link: "/plugins/manage/legacy-migration" },
    ],
  },
  {
    text: "插件开发 SDK（Plugin-SDK）",
    collapsed: false,
    items: [
      { text: "Plugin-SDK 概览", link: "/plugins/sdk/" },
      { text: "Python SDK 参考", link: "/plugins/sdk/python" },
      { text: "JavaScript / TypeScript SDK", link: "/plugins/sdk/javascript" },
      { text: "快速开发推理插件", link: "/plugins/sdk/inference-quickstart" },
      { text: "开发自定义训练器插件", link: "/plugins/sdk/trainer-quickstart" },
      { text: "CLI 检查与镜像打包", link: "/plugins/sdk/cli-and-packaging" },
    ],
  },
  {
    text: "扩展协议规范",
    collapsed: false,
    items: [
      { text: "协议概览", link: "/plugins/protocols/" },
      { text: "Extension Manifest v1", link: "/plugins/protocols/extension-manifest" },
      { text: "Inference Protocol v2", link: "/plugins/protocols/inference-v2" },
      { text: "Trainer Protocol v1", link: "/plugins/protocols/trainer-v1" },
      {
        text: "通知渠道、格式与主题规范",
        link: "/plugins/protocols/notification-format-theme",
      },
      { text: "从零编写兼容 HTTP 后端", link: "/plugins/protocols/http-from-scratch" },
    ],
  },
];
