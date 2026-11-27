<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../../lib/cn";

const props = withDefaults(
  defineProps<{
    title: string;
    badge?: string;
    badgeTone?: "neutral" | "ai" | "positive" | "caution";
    ariaLabel: string;
    showCorners?: boolean;
  }>(),
  {
    badgeTone: "neutral",
    showCorners: true,
  },
);

const badgeClass = computed(() => {
  switch (props.badgeTone) {
    case "ai":
      return "border-ai-border bg-ai-soft text-ai";
    case "positive":
      return "border-positive-border bg-positive-soft text-positive";
    case "caution":
      return "border-caution-border bg-caution-soft text-caution";
    default:
      return "border-border bg-bg text-fg-muted";
  }
});
</script>

<template>
  <figure
    class="yoao-demo yoao-ui relative my-6 overflow-hidden rounded-[var(--yoao-radius-lg)] border border-border bg-surface text-fg shadow-[var(--yoao-shadow-sm)]"
    :aria-label="ariaLabel"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-divider bg-surface-alt px-4 py-2.5"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="flex items-center gap-1.5" aria-hidden="true">
          <i class="block size-2 rounded-full border border-border-strong bg-bg"></i>
          <i class="block size-2 rounded-full border border-border-strong bg-bg"></i>
          <i class="block size-2 rounded-full border border-border-strong bg-bg"></i>
        </span>
        <span class="truncate text-[12px] font-medium tracking-[-0.01em] text-fg">
          {{ title }}
        </span>
        <span
          v-if="badge"
          :class="
            cn(
              'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] uppercase',
              badgeClass,
            )
          "
        >
          {{ badge }}
        </span>
      </div>
      <div v-if="$slots['header-extra']" class="flex items-center gap-2">
        <slot name="header-extra" />
      </div>
    </div>

    <div class="demo-stage-surface relative bg-bg-subtle p-4 sm:p-5">
      <template v-if="showCorners">
        <span
          class="pointer-events-none absolute top-2 left-2 font-mono text-[10px] leading-none text-cross select-none"
          aria-hidden="true"
          >+</span
        >
        <span
          class="pointer-events-none absolute top-2 right-2 font-mono text-[10px] leading-none text-cross select-none"
          aria-hidden="true"
          >+</span
        >
      </template>
      <slot />
    </div>

    <figcaption
      v-if="$slots.footer"
      class="border-t border-divider bg-surface px-4 py-3 text-[13px] text-fg-muted"
    >
      <slot name="footer" />
    </figcaption>
  </figure>
</template>

<style scoped>
.yoao-demo {
  container-type: inline-size;
}
.demo-stage-surface {
  background-image: var(--yoao-signature-gradient);
}
</style>
