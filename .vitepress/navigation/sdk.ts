import type { DefaultTheme } from "vitepress";

export const sdkSidebarGroup: DefaultTheme.SidebarItem = {
  text: "Platform API SDK 与 CLI",
  collapsed: true,
  items: [
    { text: "SDK 总览", link: "/sdk/" },
    { text: "快速上手", link: "/sdk/quickstart" },
    { text: "Python SDK 参考", link: "/sdk/python-client" },
    { text: "Agent 接入与操作", link: "/sdk/agents" },
    { text: "通知、反馈与预标注", link: "/sdk/workflows" },
    { text: "Data Explorer 与保存视图", link: "/sdk/data-explorer" },
    { text: "视频、模板与存储运维", link: "/sdk/video-and-templates" },
    { text: "文件上传与数据集场景", link: "/sdk/files-and-scenes" },
    { text: "账户、管理与运维", link: "/sdk/account-and-operations" },
    { text: "项目、批次与数据运维", link: "/sdk/project-workflows" },
    { text: "讨论、缺陷报告与质量处理", link: "/sdk/annotation-quality" },
    { text: "任务上下文、租约与几何工作流", link: "/sdk/task-workflows" },
    { text: "公开事件流与有界监听", link: "/sdk/streams" },
    { text: "CLI 参考", link: "/sdk/cli" },
    { text: "TUI 监控面板", link: "/sdk/tui" },
    { text: "Cookbook", link: "/sdk/cookbook" },
  ],
};
