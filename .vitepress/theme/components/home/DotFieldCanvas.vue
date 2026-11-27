<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    density?: number;
    interactive?: boolean;
  }>(),
  {
    density: 26,
    interactive: true,
  },
);

const canvasRef = ref<HTMLCanvasElement | null>(null);

let resizeObserver: ResizeObserver | undefined;
let io: IntersectionObserver | undefined;
let themeObserver: MutationObserver | undefined;
let rafId = 0;
let inView = true;
let pointerX = -9999;
let pointerY = -9999;
let pointerActive = false;
let reduceMotion = false;
let baseColor = "";
let activeColor = "";

function resolveTokenColor(host: HTMLElement, cssVar: string): string {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.color = `var(${cssVar})`;
  host.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

function refreshColors(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const host = canvas.parentElement ?? document.documentElement;
  baseColor = resolveTokenColor(host, "--yoao-rail-strong");
  activeColor = resolveTokenColor(host, "--yoao-ai-solid");
}

function draw(): void {
  rafId = 0;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const step = props.density;
  const offsetX = (width % step) / 2;
  const offsetY = (height % step) / 2;
  const radiusThreshold = 132;

  for (let y = offsetY; y < height; y += step) {
    for (let x = offsetX; x < width; x += step) {
      let radius = 1.05;
      let influence = 0;
      if (props.interactive && !reduceMotion && pointerActive) {
        const dx = x - pointerX;
        const dy = y - pointerY;
        const dist = Math.hypot(dx, dy);
        if (dist < radiusThreshold) {
          influence = 1 - dist / radiusThreshold;
          radius += influence * 1.65;
        }
      }

      if (influence > 0.14) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.85, 0.25 + influence * 0.65);
        ctx.fillStyle = activeColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function scheduleDraw(): void {
  if (!inView || rafId) return;
  rafId = window.requestAnimationFrame(draw);
}

function onPointerMove(event: PointerEvent): void {
  if (!props.interactive || reduceMotion || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  pointerX = event.clientX - rect.left;
  pointerY = event.clientY - rect.top;
  pointerActive = true;
  scheduleDraw();
}

function onPointerLeave(): void {
  pointerActive = false;
  scheduleDraw();
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  refreshColors();

  const parent = canvas.parentElement;
  if (parent && props.interactive && !reduceMotion) {
    parent.addEventListener("pointermove", onPointerMove, { passive: true });
    parent.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }

  resizeObserver = new ResizeObserver(() => scheduleDraw());
  resizeObserver.observe(canvas);

  io = new IntersectionObserver(
    ([entry]) => {
      inView = entry?.isIntersecting ?? true;
      if (inView) scheduleDraw();
    },
    { threshold: 0.05 },
  );
  io.observe(canvas);

  themeObserver = new MutationObserver(() => {
    refreshColors();
    scheduleDraw();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  scheduleDraw();
});

onBeforeUnmount(() => {
  if (rafId) window.cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  io?.disconnect();
  themeObserver?.disconnect();
  const parent = canvasRef.value?.parentElement;
  if (parent) {
    parent.removeEventListener("pointermove", onPointerMove);
    parent.removeEventListener("pointerleave", onPointerLeave);
  }
});
</script>

<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none absolute inset-0 h-full w-full"
    aria-hidden="true"
  />
</template>
