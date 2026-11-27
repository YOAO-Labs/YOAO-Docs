<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "vitepress";
import { ArrowUpRight } from "lucide-vue-next";

const props = defineProps<{
  icon?: string;
  title: string;
  desc?: string;
  href: string;
  badge?: string;
}>();

const external = computed(() => /^https?:\/\//.test(props.href));
const resolved = computed(() => (external.value ? props.href : withBase(props.href)));
</script>

<template>
  <a
    class="doc-link-card group"
    :href="resolved"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noreferrer' : undefined"
  >
    <span v-if="icon" class="dlc-icon" aria-hidden="true">{{ icon }}</span>
    <span class="dlc-body">
      <span class="dlc-title">
        {{ title }}
        <span v-if="badge" class="dlc-badge">{{ badge }}</span>
      </span>
      <span v-if="desc" class="dlc-desc">{{ desc }}</span>
    </span>
    <ArrowUpRight class="dlc-arrow" :size="16" aria-hidden="true" />
  </a>
</template>

<style scoped>
.doc-link-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  height: 100%;
  padding: 17px 18px;
  border: 1px solid var(--yoao-border);
  border-radius: var(--yoao-radius);
  background: var(--yoao-surface);
  text-decoration: none !important;
  color: var(--yoao-fg);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}
.doc-link-card:hover {
  border-color: var(--yoao-border-strong);
  background: var(--yoao-surface-alt);
  box-shadow: var(--yoao-shadow-sm);
}
.dlc-icon {
  font-size: 20px;
  line-height: 1.2;
  flex-shrink: 0;
}
.dlc-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.dlc-title {
  font-weight: 600;
  font-size: 14.5px;
  line-height: 1.4;
  color: var(--yoao-fg);
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.dlc-badge {
  font-family: var(--docs-font-mono);
  font-size: 10.5px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 9999px;
  border: 1px solid var(--yoao-accent-border);
  background: var(--yoao-accent-soft);
  color: var(--yoao-accent);
}
.dlc-desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--yoao-fg-muted);
}
.dlc-arrow {
  margin-left: auto;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
  color: var(--yoao-fg-subtle);
  transition:
    color 0.18s ease,
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.doc-link-card:hover .dlc-arrow {
  color: var(--yoao-accent);
  transform: translate(2px, -2px);
}
</style>
