import DefaultTheme from "vitepress/theme";
import DocsLayout from "./DocsLayout.vue";
import ExcalidrawDiagram from "./components/ExcalidrawDiagram.vue";
import DocsHome from "./components/DocsHome.vue";
import DocLinkCard from "./components/DocLinkCard.vue";
import ApiReferenceFrame from "./components/ApiReferenceFrame.vue";
import DocsVideo from "./components/DocsVideo.vue";
import RedirectPage from "./components/RedirectPage.vue";
import CandidateReviewDemo from "./components/demo/CandidateReviewDemo.vue";
import ComponentsPlayground from "./components/ComponentsPlayground.vue";
import { setupMermaidZoom } from "./mermaid-zoom";
import { setupImageZoom } from "./image-zoom";
import { setupPlatformKeys } from "./platform-keys";
import "./styles/tokens.css";
import "./styles/tailwind.css";
import "./docs-theme.css";
import "./docs-home.css";
import "./mermaid-zoom.css";
import type { Theme } from "vitepress";

export default {
  extends: DefaultTheme,
  Layout: DocsLayout,
  enhanceApp({ app, router }) {
    app.component("ExcalidrawDiagram", ExcalidrawDiagram);
    app.component("DocsHome", DocsHome);
    app.component("DocLinkCard", DocLinkCard);
    app.component("ApiReferenceFrame", ApiReferenceFrame);
    app.component("DocsVideo", DocsVideo);
    app.component("RedirectPage", RedirectPage);
    app.component("CandidateReviewDemo", CandidateReviewDemo);
    app.component("ComponentsPlayground", ComponentsPlayground);
    setupMermaidZoom();
    setupImageZoom();
    setupPlatformKeys(router);
  },
} satisfies Theme;
