<script setup lang="ts">
import { ref } from "vue";
import { withBase } from "vitepress";
import { ExternalLink } from "lucide-vue-next";

const src = withBase("/api-reference.html");
const loaded = ref(false);
</script>

<template>
  <div class="api-ref-frame">
    <div class="api-ref-bar">
      <span class="api-ref-label">OpenAPI Reference</span>
      <a class="api-ref-fullscreen" :href="src" target="_blank" rel="noreferrer">
        <span>全屏打开</span>
        <ExternalLink :size="13" aria-hidden="true" />
      </a>
    </div>
    <div class="api-ref-viewport">
      <div v-if="!loaded" class="api-ref-loading" aria-hidden="true">加载 API Reference…</div>
      <iframe :src="src" title="API Reference" loading="lazy" @load="loaded = true"></iframe>
    </div>
  </div>
</template>

<style scoped>
.api-ref-frame {
  margin: 24px 0 8px;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius-lg);
  overflow: hidden;
  background: var(--yoao-surface-alt);
  box-shadow: var(--yoao-shadow-sm);
}
.api-ref-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--yoao-divider);
  background: var(--yoao-surface-alt);
}
.api-ref-label {
  font-family: var(--docs-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--yoao-fg-muted);
}
.api-ref-fullscreen {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 550;
  color: var(--yoao-accent) !important;
  text-decoration: none !important;
}
.api-ref-fullscreen:hover {
  color: var(--yoao-accent-hover) !important;
}
.api-ref-viewport {
  position: relative;
  height: min(80vh, 900px);
  background: var(--yoao-bg);
}
.api-ref-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: var(--yoao-fg-subtle);
}
.api-ref-viewport iframe {
  position: relative;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
@media (max-width: 640px) {
  .api-ref-viewport {
    height: 70vh;
  }
}
</style>
