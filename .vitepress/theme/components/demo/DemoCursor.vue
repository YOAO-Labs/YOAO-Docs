<script setup lang="ts">
withDefaults(
  defineProps<{
    x: number;
    y: number;
    visible?: boolean;
    clicking?: boolean;
    smooth?: boolean;
  }>(),
  {
    visible: true,
    clicking: false,
    smooth: true,
  },
);
</script>

<template>
  <div
    v-if="visible"
    class="demo-cursor pointer-events-none absolute top-0 left-0 z-20"
    :class="{ 'is-smooth': smooth }"
    :style="{ transform: `translate3d(${x}px, ${y}px, 0)` }"
    aria-hidden="true"
  >
    <span
      v-if="clicking"
      class="demo-cursor-ripple absolute -top-2.5 -left-2.5 size-6 rounded-full border border-ai-solid bg-ai-soft"
    ></span>
    <svg
      class="relative block h-[22px] w-[18px] drop-shadow-sm"
      viewBox="0 0 20 24"
      fill="none"
    >
      <path
        d="M2.5 2.5L16.5 12L9.8 13.1L6.7 19.8L2.5 2.5Z"
        fill="var(--yoao-fg)"
        stroke="var(--yoao-bg)"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<style scoped>
.demo-cursor.is-smooth {
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.demo-cursor-ripple {
  animation: demo-cursor-ping 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes demo-cursor-ping {
  0% {
    opacity: 0.9;
    transform: scale(0.45);
  }
  100% {
    opacity: 0;
    transform: scale(1.65);
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-cursor.is-smooth {
    transition: none;
  }
  .demo-cursor-ripple {
    animation: none;
    opacity: 0;
  }
}
</style>
