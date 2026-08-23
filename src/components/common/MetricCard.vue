<template>
  <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ label }}</p>
        <h3 class="mt-2 text-2xl font-black text-slate-900">{{ value }}</h3>
        <p class="mt-1 text-xs text-slate-500">{{ helper }}</p>
      </div>
      <div :class="['flex h-10 w-10 items-center justify-center rounded-xl', toneClass]">
        <slot name="icon" />
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  helper: { type: String, default: '' },
  toneClass: { type: String, default: 'bg-slate-100 text-slate-700' },
});
</script>
