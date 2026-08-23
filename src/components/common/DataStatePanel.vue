<template>
  <div
    v-if="loading || error || showEmpty"
    class="rounded-2xl border px-4 py-5 text-sm shadow-sm"
    :class="panelClass"
  >
    <div class="flex items-start gap-3">
      <div
        class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        :class="iconWrapClass"
      >
        <component :is="iconComponent" class="h-4 w-4" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-bold" :class="titleClass">{{ title }}</h3>
        <p class="mt-1 text-xs" :class="descriptionClass">{{ message }}</p>
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AlertTriangle, Loader2, Inbox } from 'lucide-vue-next';

const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  empty: { type: Boolean, default: false },
  title: { type: String, default: '' },
  loadingMessage: { type: String, default: 'Chargement en cours...' },
  errorMessage: { type: String, default: 'Une erreur est survenue.' },
  emptyMessage: { type: String, default: 'Aucune donnée disponible.' },
});

const showEmpty = computed(() => props.empty && !props.loading && !props.error);
const message = computed(() => {
  if (props.loading) return props.loadingMessage;
  if (props.error) return props.error || props.errorMessage;
  return props.emptyMessage;
});
const iconComponent = computed(() => {
  if (props.loading) return Loader2;
  if (props.error) return AlertTriangle;
  return Inbox;
});
const panelClass = computed(() => {
  if (props.loading) return 'border-slate-200 bg-slate-50';
  if (props.error) return 'border-rose-200 bg-rose-50';
  return 'border-dashed border-slate-300 bg-white';
});
const iconWrapClass = computed(() => {
  if (props.loading) return 'bg-slate-100 text-slate-600';
  if (props.error) return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-500';
});
const titleClass = computed(() => {
  if (props.error) return 'text-rose-800';
  if (props.loading) return 'text-slate-900';
  return 'text-slate-900';
});
const descriptionClass = computed(() => {
  if (props.error) return 'text-rose-700';
  if (props.loading) return 'text-slate-500';
  return 'text-slate-500';
});
</script>
