<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Historique des mouvements & circulation</h2>
        <p class="mt-0.5 text-xs text-slate-500">Journal immuable des affectations, mutations et libérations</p>
      </div>
      <span class="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">{{ movements.length }} mouvements enregistrés</span>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="option in ['ALL', 'ENTRY', 'EXIT', 'TRANSFER']"
          :key="option"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="typeFilter === option ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="typeFilter = option"
        >
          {{ option === 'ALL' ? `Tous (${movements.length})` : option === 'ENTRY' ? 'Entrées / Affectations' : option === 'EXIT' ? 'Sorties / Libérations' : 'Mutations / Transferts' }}
        </button>
      </div>
      <input v-model="searchQuery" type="text" placeholder="Rechercher place, commerçant, motif..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 md:w-80">
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
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
            <tr v-for="movement in filteredMovements" :key="movement.id" class="hover:bg-slate-50/80">
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
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { marketStore } from '../../store/index.js';

const movements = computed(() => marketStore.state.movements);
const typeFilter = ref('ALL');
const searchQuery = ref('');

const filteredMovements = computed(() =>
  movements.value.filter((movement) => {
    const matchType = typeFilter.value === 'ALL' || movement.type === typeFilter.value;
    const q = searchQuery.value.toLowerCase();
    const matchSearch =
      !q ||
      movement.placeCode.toLowerCase().includes(q) ||
      (movement.oldMerchantName && movement.oldMerchantName.toLowerCase().includes(q)) ||
      (movement.newMerchantName && movement.newMerchantName.toLowerCase().includes(q)) ||
      movement.reason.toLowerCase().includes(q) ||
      movement.executedBy.toLowerCase().includes(q);
    return matchType && matchSearch;
  })
);
</script>
