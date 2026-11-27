<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import { Check, Copy, ExternalLink, Image as ImageIcon } from "lucide-vue-next";

const open = ref(false);
const pos = ref({ x: 16, y: 56 });
const copiedKey = ref<"name" | "icon" | null>(null);
const menuRef = ref<HTMLElement | null>(null);

let closeTimer: number | undefined;

function closeMenu(): void {
  open.value = false;
  copiedKey.value = null;
  if (closeTimer !== undefined) {
    window.clearTimeout(closeTimer);
    closeTimer = undefined;
  }
}

function handleContextMenu(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (!target?.closest(".VPNavBarTitle a.title")) return;
  event.preventDefault();
  const maxX = Math.max(8, window.innerWidth - 236);
  const maxY = Math.max(8, window.innerHeight - 160);
  pos.value = {
    x: Math.min(Math.max(8, event.clientX), maxX),
    y: Math.min(Math.max(8, event.clientY), maxY),
  };
  copiedKey.value = null;
  open.value = true;
  void nextTick(() => {
    const first = menuRef.value?.querySelector<HTMLElement>('[role="menuitem"]');
    first?.focus();
  });
}

function handlePointerDown(event: PointerEvent): void {
  if (!open.value) return;
  const target = event.target as Node | null;
  if (menuRef.value && target && !menuRef.value.contains(target)) {
    closeMenu();
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!open.value) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    return;
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const items = Array.from(menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  if (!items.length) return;
  event.preventDefault();
  const idx = items.indexOf(document.activeElement as HTMLElement);
  const delta = event.key === "ArrowDown" ? 1 : -1;
  const next = (idx + delta + items.length) % items.length;
  items[next]?.focus();
}

async function copyText(key: "name" | "icon", value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    copiedKey.value = key;
    if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      closeMenu();
    }, 850);
  } catch {
    closeMenu();
  }
}

function copyBrandName(): void {
  void copyText("name", "YOAO");
}

function copyBrandIconUrl(): void {
  const url = new URL(withBase("/ai-annotation-platform-icon.svg"), window.location.origin).href;
  void copyText("icon", url);
}

onMounted(() => {
  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  if (closeTimer !== undefined) window.clearTimeout(closeTimer);
  document.removeEventListener("contextmenu", handleContextMenu);
  document.removeEventListener("pointerdown", handlePointerDown);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="menuRef"
      data-brand-logo-menu
      role="menu"
      aria-label="YOAO 品牌快捷操作"
      class="yoao-ui fixed z-[220] w-[224px] rounded-[var(--yoao-radius)] border border-border bg-surface p-1.5 text-[13px] text-fg shadow-[var(--yoao-shadow-md)] backdrop-blur-md"
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    >
      <div class="px-2.5 py-1.5 font-mono text-[10px] tracking-[0.08em] text-fg-subtle uppercase">
        Brand Assets
      </div>
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 rounded-[var(--yoao-radius-sm)] px-2.5 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
        @click="copyBrandName"
      >
        <Check v-if="copiedKey === 'name'" class="size-3.5 shrink-0 text-positive" />
        <Copy v-else class="size-3.5 shrink-0 text-fg-muted" />
        <span class="truncate">{{ copiedKey === "name" ? "已复制 YOAO" : "复制站点名称 (YOAO)" }}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 rounded-[var(--yoao-radius-sm)] px-2.5 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
        @click="copyBrandIconUrl"
      >
        <Check v-if="copiedKey === 'icon'" class="size-3.5 shrink-0 text-positive" />
        <ImageIcon v-else class="size-3.5 shrink-0 text-fg-muted" />
        <span class="truncate">{{ copiedKey === "icon" ? "已复制图标链接" : "复制品牌图标链接" }}</span>
      </button>
      <div class="my-1 h-px bg-divider" role="separator"></div>
      <a
        role="menuitem"
        href="https://github.com/YOAO-Labs/YOAO"
        target="_blank"
        rel="noreferrer"
        class="flex w-full items-center justify-between gap-2 rounded-[var(--yoao-radius-sm)] px-2.5 py-2 text-fg no-underline transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
        @click="closeMenu"
      >
        <span>访问 GitHub 仓库</span>
        <ExternalLink class="size-3.5 shrink-0 text-fg-subtle" />
      </a>
    </div>
  </Teleport>
</template>
