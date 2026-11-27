<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "vitepress";
import { Download } from "lucide-vue-next";

const props = defineProps<{
  src: string;
  alt: string;
  caption?: string;
}>();

function publicUrl(src: string): string {
  if (/^(?:[a-z]+:|\/\/)/i.test(src)) return src;
  return withBase(src.startsWith("/") ? src : `/${src}`);
}

const resolvedSrc = computed(() => publicUrl(props.src));
const downloadName = computed(() => {
  const clean = props.src.split(/[?#]/, 1)[0];
  return clean.split("/").at(-1) || "diagram.svg";
});
</script>

<template>
  <figure class="excalidraw-diagram">
    <div class="excalidraw-diagram__frame">
      <img class="excalidraw-diagram__image" :src="resolvedSrc" :alt="alt" />
    </div>
    <figcaption>
      <span v-if="caption">{{ caption }}</span>
      <a :href="resolvedSrc" :download="downloadName" :aria-label="`下载可编辑 SVG：${alt}`">
        <Download :size="13" aria-hidden="true" />
        <span>下载可编辑 SVG</span>
      </a>
    </figcaption>
  </figure>
</template>

<style scoped>
.excalidraw-diagram {
  margin: 1.75rem 0;
}

.excalidraw-diagram__frame {
  overflow: hidden;
  padding: 0.75rem;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius);
  background: var(--yoao-paper-white);
  box-shadow: var(--yoao-shadow-sm);
}

.excalidraw-diagram__frame img {
  display: block;
  width: 100%;
  max-width: 100%;
  border: 0;
  border-radius: 0;
}

figcaption {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem 0.75rem;
  margin-top: 0.55rem;
  color: var(--yoao-fg-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}

figcaption a {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--yoao-accent);
  font-weight: 550;
  text-decoration: none;
}

figcaption a:hover {
  color: var(--yoao-accent-hover);
  text-decoration: underline;
}
</style>
