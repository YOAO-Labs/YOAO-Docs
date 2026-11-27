import type { DefaultTheme } from "vitepress";

export const nav: DefaultTheme.NavItem[] = [
  { text: "使用指南", link: "/user-guide/", activeMatch: "^/user-guide/" },
  { text: "插件生态", link: "/plugins/", activeMatch: "^/plugins/" },
  { text: "API 与 SDK", link: "/api/", activeMatch: "^/(api|sdk)/" },
  { text: "核心开发", link: "/dev/", activeMatch: "^/dev/" },
  {
    text: "...",
    items: [
      { text: "部署运维", link: "/ops/", activeMatch: "^/ops/" },
      { text: "更新日志", link: "/changelog/", activeMatch: "^/changelog/" },
    ],
  },
];
