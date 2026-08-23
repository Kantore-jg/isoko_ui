<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Historique des mouvements & circulation</h2>
        <p class="mt-0.5 text-xs text-slate-500">Journal immuable des affectations, mutations et libérations</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" :disabled="!filteredMovements.length" @click="downloadFilteredCsv">
          Exporter CSV
        </button>
        <span class="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">{{ filteredMovements.length }} mouvements trouvés</span>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div class="xl:col-span-1">
          <label class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Type</label>
          <select v-model="typeFilter" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none">
            <option value="ALL">Tous les types</option>
            <option value="ENTRY">Entrées / Affectations</option>
            <option value="EXIT">Sorties / Libérations</option>
            <option value="TRANSFER">Mutations / Transferts</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Du</label>
          <input v-model="dateFrom" type="date" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none">
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Au</label>
          <input v-model="dateTo" type="date" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none">
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Place / commerçant</label>
          <input v-model="searchQuery" type="text" placeholder="Nom, place, motif..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Opérateur</label>
          <input v-model="operatorQuery" type="text" placeholder="Nom opérateur" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p class="text-[11px] text-slate-500">
          Les filtres s’appliquent avant la pagination et l’export.
        </p>
        <button class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50" @click="resetFilters">
          Réinitialiser
        </button>
      </div>
    </div>

    <DataStatePanel
      :loading="isLoading"
      :error="dataError"
      :empty="filteredMovements.length === 0 && !isLoading && !dataError"
      title="Mouvements"
      loading-message="Chargement des mouvements..."
      error-message="Impossible de charger les mouvements."
      empty-message="Aucun mouvement ne correspond aux filtres actifs."
    />

    <div v-if="!isLoading && !dataError && filteredMovements.length > 0" class="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Place</th>
              <th class="px-4 py-3">Mouvement</th>
              <th class="px-4 py-3">Détail</th>
              <th class="px-4 py-3">Motif</th>
              <th class="px-4 py-3">Opérateur</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="movement in paginatedMovements" :key="movement.id" class="hover:bg-slate-50/80">
              <td class="px-4 py-3 font-mono text-slate-600">{{ movement.date }}</td>
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ movement.placeCode }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                  :class="movement.type === 'ENTRY' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : movement.type === 'EXIT' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-teal-200 bg-teal-50 text-teal-800'">
                  {{ movement.typeLabel }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-900">
                <span v-if="movement.newMerchantName">{{ movement.newMerchantName }}</span>
                <span v-else-if="movement.oldMerchantName">{{ movement.oldMerchantName }}</span>
              </td>
              <td class="px-4 py-3 italic text-slate-600">{{ movement.reason }}</td>
              <td class="px-4 py-3 text-slate-500">{{ movement.executedBy }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PaginationControls
      v-if="!isLoading && !dataError && filteredMovements.length > 0"
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total-items="filteredMovements.length"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PaginationControls from '../common/PaginationControls.vue';
import DataStatePanel from '../common/DataStatePanel.vue';
import { marketStore } from '../../store/index.js';

const movements = computed(() => marketStore.state.movements);
const isLoading = computed(() => marketStore.state.isLoadingData);
const dataError = computed(() => marketStore.state.dataError || '');
const typeFilter = ref('ALL');
const dateFrom = ref('');
const dateTo = ref('');
const searchQuery = ref('');
const operatorQuery = ref('');
const currentPage = ref(1);
const pageSize = 10;

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const filteredMovements = computed(() =>
  movements.value.filter((movement) => {
    const matchType = typeFilter.value === 'ALL' || movement.type === typeFilter.value;
    const q = searchQuery.value.trim().toLowerCase();
    const operator = operatorQuery.value.trim().toLowerCase();
    const afterStart = !dateFrom.value || !movement.date || movement.date >= dateFrom.value;
    const beforeEnd = !dateTo.value || !movement.date || movement.date <= dateTo.value;
    const matchSearch =
      !q ||
      movement.placeCode.toLowerCase().includes(q) ||
      (movement.oldMerchantName && movement.oldMerchantName.toLowerCase().includes(q)) ||
      (movement.newMerchantName && movement.newMerchantName.toLowerCase().includes(q)) ||
      movement.reason.toLowerCase().includes(q);
    const matchOperator = !operator || movement.executedBy.toLowerCase().includes(operator);
    return matchType && afterStart && beforeEnd && matchSearch && matchOperator;
  })
);

const paginatedMovements = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredMovements.value.slice(start, start + pageSize);
});

watch([typeFilter, searchQuery], () => {
  currentPage.value = 1;
});

watch(filteredMovements, () => {
  const totalPages = Math.max(1, Math.ceil(filteredMovements.value.length / pageSize));
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages;
  }
});

function resetFilters() {
  typeFilter.value = 'ALL';
  dateFrom.value = '';
  dateTo.value = '';
  searchQuery.value = '';
  operatorQuery.value = '';
}

function downloadFilteredCsv() {
  if (!filteredMovements.value.length) return;

  const headers = ['date', 'placeCode', 'typeLabel', 'newMerchantName', 'oldMerchantName', 'reason', 'executedBy'];
  const lines = [
    headers.join(','),
    ...filteredMovements.value.map((movement) =>
      headers.map((header) => csvEscape(movement[header])).join(',')
    ),
  ];

  downloadText(`movements-${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'));
}
</script>
