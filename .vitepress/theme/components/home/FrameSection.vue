<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../../lib/cn";

const props = withDefaults(
  defineProps<{
    id?: string;
    corners?: "top" | "bottom" | "both" | "none";
    railTone?: "subtle" | "solid";
    padding?: "hero" | "section" | "compact" | "none";
    innerClass?: string;
  }>(),
  {
    corners: "both",
    railTone: "subtle",
    padding: "section",
  },
);

const showTop = computed(() => props.corners === "top" || props.corners === "both");
const showBottom = computed(() => props.corners === "bottom" || props.corners === "both");
const borderClass = computed(() =>
  props.railTone === "solid" ? "border-border-strong" : "border-rail",
);
const paddingClass = computed(() => {
  switch (props.padding) {
    case "hero":
      return "px-5 pt-24 pb-12 sm:px-8 sm:pt-28 sm:pb-16 lg:px-12";
    case "compact":
      return "px-5 py-10 sm:px-8 sm:py-12 lg:px-12";
    case "none":
      return "";
    default:
      return "px-5 py-14 sm:px-8 sm:py-20 lg:px-12";
  }
});
</script>

<template>
  <section :id="id" :class="cn('yoao-frame-section relative w-full border-b', borderClass)">
    <div
      :class="cn('relative mx-auto max-w-[1180px] border-x', borderClass, paddingClass, innerClass)"
    >
      <template v-if="showTop">
        <svg
          class="pointer-events-none absolute -top-[5px] -left-[5px] z-10 size-[9px] text-cross"
          viewBox="0 0 9 9"
          aria-hidden="true"
        >
          <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" stroke-width="1" />
        </svg>
        <svg
          class="pointer-events-none absolute -top-[5px] -right-[5px] z-10 size-[9px] text-cross"
          viewBox="0 0 9 9"
          aria-hidden="true"
        >
          <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" stroke-width="1" />
        </svg>
      </template>

      <slot />

      <template v-if="showBottom">
        <svg
          class="pointer-events-none absolute -bottom-[5px] -left-[5px] z-10 size-[9px] text-cross"
          viewBox="0 0 9 9"
          aria-hidden="true"
        >
          <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" stroke-width="1" />
        </svg>
        <svg
          class="pointer-events-none absolute -bottom-[5px] -right-[5px] z-10 size-[9px] text-cross"
          viewBox="0 0 9 9"
          aria-hidden="true"
        >
          <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" stroke-width="1" />
        </svg>
      </template>
    </div>
  </section>
</template>
