<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number;
    variant?: "list" | "sidebar" | "inspector" | "toolbar";
  }>(),
  {
    rows: 3,
    variant: "list",
  },
);
</script>

<template>
  <div v-if="variant === 'toolbar'" class="flex flex-col gap-2" aria-hidden="true">
    <div
      v-for="n in rows"
      :key="n"
      class="h-6 w-6 rounded-[var(--yoao-radius-sm)] border border-divider bg-surface-alt"
    ></div>
  </div>

  <div v-else-if="variant === 'sidebar'" class="flex flex-col gap-2.5" aria-hidden="true">
    <div class="h-2.5 w-16 rounded-full bg-border"></div>
    <div v-for="n in rows" :key="n" class="flex items-center gap-2 py-1">
      <span class="size-2 shrink-0 rounded-[2px] bg-border-strong"></span>
      <span
        class="h-2 rounded-full bg-divider"
        :style="{ width: `${52 + ((n * 19) % 36)}%` }"
      ></span>
    </div>
  </div>

  <div v-else-if="variant === 'inspector'" class="flex flex-col gap-3" aria-hidden="true">
    <div class="h-2.5 w-20 rounded-full bg-border"></div>
    <div
      v-for="n in rows"
      :key="n"
      class="flex flex-col gap-1.5 rounded-[var(--yoao-radius-sm)] border border-divider bg-bg-subtle p-2.5"
    >
      <span class="h-2 rounded-full bg-border" :style="{ width: `${45 + ((n * 17) % 35)}%` }"></span>
      <span class="h-1.5 w-4/5 rounded-full bg-divider"></span>
    </div>
  </div>

  <div v-else class="flex flex-col divide-y divide-divider" aria-hidden="true">
    <div
      v-for="n in rows"
      :key="n"
      class="flex h-12 items-center justify-between gap-4 px-3"
    >
      <span class="h-2 rounded-full bg-divider" :style="{ width: `${22 + ((n * 11) % 18)}%` }"></span>
      <div class="flex items-center gap-3">
        <span class="h-2 w-12 rounded-full bg-divider"></span>
        <span class="h-2 w-16 rounded-full bg-divider"></span>
      </div>
    </div>
  </div>
</template>
