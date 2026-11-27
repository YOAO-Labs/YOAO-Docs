<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, withBase } from "vitepress";

const props = defineProps<{
  to: string;
  note?: string;
}>();

const router = useRouter();

onMounted(() => {
  if (typeof window === "undefined") {
    return;
  }
  const hash = window.location.hash || "";
  router.go(`${withBase(props.to)}${hash}`);
});
</script>

<template>
  <div class="redirect-notice">
    <h1>页面已迁移</h1>
    <p v-if="note">{{ note }}</p>
    <p>
      正在跳转到新页面：<a :href="withBase(to)">{{ to }}</a>
    </p>
  </div>
</template>
