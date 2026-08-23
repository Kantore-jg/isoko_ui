<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-bold text-slate-900">Registre des affectations</h2>
        </div>
        <p class="mt-0.5 text-xs text-slate-500">Historique complet des baux d'occupation</p>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">{{ activeCount }} En cours</span>
        <span class="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{{ endedCount }} Clôturées</span>
      </div>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="option in ['ALL', 'ACTIVE', 'ENDED']"
          :key="option"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="statusFilter === option ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="statusFilter = option"
        >
          {{ option === 'ALL' ? `Toutes (${assignments.length})` : option === 'ACTIVE' ? `Actives (${activeCount})` : `Clôturées (${endedCount})` }}
        </button>
      </div>
      <input v-model="searchQuery" type="text" placeholder="Rechercher place ou commerçant..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 md:w-80">
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Place</th>
              <th class="px-4 py-3">Commerçant</th>
              <th class="px-4 py-3">Début</th>
              <th class="px-4 py-3">Fin</th>
              <th class="px-4 py-3">Loyer</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3">Observations</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="assignment in filteredAssignments" :key="assignment.id" class="hover:bg-slate-50/80">
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ assignment.placeCode }}</td>
              <td class="px-4 py-3 font-semibold text-slate-900">{{ assignment.merchantName }}</td>
              <td class="px-4 py-3 font-mono text-slate-600">{{ assignment.startDate }}</td>
              <td class="px-4 py-3 font-mono text-slate-500">{{ assignment.endDate || 'En cours' }}</td>
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ assignment.rentAmount.toLocaleString() }} FBu</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold" :class="assignment.status === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-700'">
                  {{ assignment.status === 'ACTIVE' ? 'Actif' : 'Clôturé' }}
                </span>
              </td>
              <td class="px-4 py-3 italic text-slate-500">{{ assignment.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { marketStore } from '../../store/index.js';

const assignments = computed(() => marketStore.state.assignments);
const statusFilter = ref('ALL');
const searchQuery = ref('');

const filteredAssignments = computed(() =>
  assignments.value.filter((assignment) => {
    const matchStatus = statusFilter.value === 'ALL' || assignment.status === statusFilter.value;
    const q = searchQuery.value.toLowerCase();
    const matchSearch =
      !q ||
      assignment.placeCode.toLowerCase().includes(q) ||
      assignment.merchantName.toLowerCase().includes(q) ||
      (assignment.notes && assignment.notes.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  })
);

const activeCount = computed(() => assignments.value.filter((assignment) => assignment.status === 'ACTIVE').length);
const endedCount = computed(() => assignments.value.filter((assignment) => assignment.status === 'ENDED').length);
</script>
