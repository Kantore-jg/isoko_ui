<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Suivi des échéances & loyers mensuels</h2>
        <p class="mt-0.5 text-xs text-slate-500">Identification des mois acquittés et des mois impayés par emplacement</p>
      </div>
      <button class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700" @click="marketStore.setIsNewPaymentModalOpen(true)">
        Encaisser un loyer
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[11px] font-bold uppercase text-slate-400">Total encaissé</p>
        <p class="mt-1 text-xl font-extrabold text-emerald-700">{{ totalPaid.toLocaleString() }} FBu</p>
      </div>
      <div class="rounded-xl border border-rose-200 bg-rose-50/20 p-4 shadow-sm">
        <p class="text-[11px] font-bold uppercase text-rose-500">Total impayé</p>
        <p class="mt-1 text-xl font-extrabold text-rose-600">{{ totalDue.toLocaleString() }} FBu</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[11px] font-bold uppercase text-slate-400">Échéances affichées</p>
        <p class="mt-1 text-xl font-extrabold text-slate-900">{{ filteredObligations.length }}</p>
      </div>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <select v-model="statusFilter" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          <option value="ALL">Tous les statuts</option>
          <option value="PAID">Payés</option>
          <option value="OVERDUE">En retard</option>
          <option value="PENDING">En attente</option>
          <option value="PARTIAL">Partiel</option>
        </select>
        <select v-model="monthFilter" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          <option value="ALL">Toute l'année {{ currentYear }}</option>
          <option v-for="month in months" :key="month.num" :value="month.num">{{ month.name }} {{ currentYear }}</option>
        </select>
      </div>
      <input v-model="searchQuery" type="text" placeholder="Rechercher commerçant, place..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 md:w-80">
    </div>

    <DataStatePanel
      :loading="isLoading"
      :error="dataError"
      :empty="filteredObligations.length === 0 && !isLoading && !dataError"
      title="Loyers"
      loading-message="Chargement des échéances..."
      error-message="Impossible de charger les échéances."
      empty-message="Aucune échéance ne correspond aux filtres actifs."
    />

    <div v-if="!isLoading && !dataError && filteredObligations.length > 0" class="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Période</th>
              <th class="px-4 py-3">Place</th>
              <th class="px-4 py-3">Commerçant</th>
              <th class="px-4 py-3">Échéance</th>
              <th class="px-4 py-3 text-right">Loyer fixé</th>
              <th class="px-4 py-3 text-right">Montant réglé</th>
              <th class="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="obligation in paginatedObligations" :key="obligation.id" class="hover:bg-slate-50/80">
              <td class="px-4 py-3 font-bold text-slate-900">{{ obligation.periodLabel }}</td>
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ obligation.placeCode }}</td>
              <td class="px-4 py-3 font-semibold text-slate-800">{{ obligation.merchantName }}</td>
              <td class="px-4 py-3 font-mono text-slate-500">{{ obligation.dueDate }}</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-slate-900">{{ obligation.amountExpected.toLocaleString() }} FBu</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-emerald-700">{{ obligation.amountPaid.toLocaleString() }} FBu</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                  :class="obligation.status === 'PAID' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : obligation.status === 'OVERDUE' ? 'border-rose-200 bg-rose-50 text-rose-800' : obligation.status === 'PARTIAL' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-100 text-slate-700'">
                  {{ obligation.status === 'PAID' ? 'Acquitté' : obligation.status === 'OVERDUE' ? 'Impayé' : obligation.status === 'PARTIAL' ? 'Partiel' : 'En attente' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PaginationControls
      v-if="!isLoading && !dataError && filteredObligations.length > 0"
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total-items="filteredObligations.length"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PaginationControls from '../common/PaginationControls.vue';
import DataStatePanel from '../common/DataStatePanel.vue';
import { marketStore } from '../../store/index.js';

const obligations = computed(() => marketStore.state.obligations);
const isLoading = computed(() => marketStore.state.isLoadingData);
const dataError = computed(() => marketStore.state.dataError || '');
const statusFilter = ref('ALL');
const monthFilter = ref('ALL');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 10;

const months = [
  { num: 1, name: 'Janvier' },
  { num: 2, name: 'Février' },
  { num: 3, name: 'Mars' },
  { num: 4, name: 'Avril' },
  { num: 5, name: 'Mai' },
  { num: 6, name: 'Juin' },
  { num: 7, name: 'Juillet' },
  { num: 8, name: 'Août' },
];

const filteredObligations = computed(() =>
  obligations.value.filter((obligation) => {
    const matchStatus = statusFilter.value === 'ALL' || obligation.status === statusFilter.value;
    const matchMonth = monthFilter.value === 'ALL' || obligation.periodMonth === Number(monthFilter.value);
    const q = searchQuery.value.toLowerCase();
    const matchSearch =
      !q ||
      obligation.merchantName.toLowerCase().includes(q) ||
      obligation.placeCode.toLowerCase().includes(q) ||
      obligation.periodLabel.toLowerCase().includes(q);
    return matchStatus && matchMonth && matchSearch;
  })
);

const paginatedObligations = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredObligations.value.slice(start, start + pageSize);
});

const totalDue = computed(() =>
  filteredObligations.value.filter((item) => item.status !== 'PAID').reduce((sum, item) => sum + item.balance, 0)
);
const totalPaid = computed(() => filteredObligations.value.reduce((sum, item) => sum + item.amountPaid, 0));

watch([statusFilter, monthFilter, searchQuery], () => {
  currentPage.value = 1;
});

watch(filteredObligations, () => {
  const totalPages = Math.max(1, Math.ceil(filteredObligations.value.length / pageSize));
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages;
  }
});
</script>
