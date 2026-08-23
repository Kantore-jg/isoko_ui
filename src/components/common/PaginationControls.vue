<template>
  <div v-if="totalItems > 0" class="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-xs text-slate-500">
      Affichage de {{ startItem }} à {{ endItem }} sur {{ totalItems }}
    </p>

    <div class="flex items-center gap-1">
      <button
        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="currentPage <= 1"
        @click="$emit('update:currentPage', currentPage - 1)"
      >
        Précédent
      </button>

      <button
        v-for="page in pages"
        :key="page"
        class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
        :class="page === currentPage ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
        @click="$emit('update:currentPage', page)"
      >
        {{ page }}
      </button>

      <button
        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="currentPage >= totalPages"
        @click="$emit('update:currentPage', currentPage + 1)"
      >
        Suivant
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  totalItems: { type: Number, required: true },
});

defineEmits(['update:currentPage']);

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pageSize)));
const pages = computed(() => {
  const maxButtons = 5;
  const start = Math.max(1, Math.min(props.currentPage - 2, totalPages.value - maxButtons + 1));
  const end = Math.min(totalPages.value, start + maxButtons - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});
const startItem = computed(() => Math.min(props.totalItems, (props.currentPage - 1) * props.pageSize + 1));
const endItem = computed(() => Math.min(props.totalItems, props.currentPage * props.pageSize));
</script>
