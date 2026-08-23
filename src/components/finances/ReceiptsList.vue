<template>
  <section class="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Registre des reçus</h2>
        <p class="mt-1 text-xs text-slate-500">Reçus émis, consultation détaillée et annulation contrôlée.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <input v-model="searchQuery" type="text" placeholder="Rechercher reçu, commerçant, banque..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 md:w-80">
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Reçu</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Commerçant</th>
              <th class="px-4 py-3">Banque</th>
              <th class="px-4 py-3">Montant</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="receipt in paginatedReceipts" :key="receipt.id" class="hover:bg-slate-50/80">
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ receipt.receiptNumber }}</td>
              <td class="px-4 py-3 font-mono text-slate-500">{{ receipt.receiptDate || receipt.paymentDate }}</td>
              <td class="px-4 py-3 font-semibold text-slate-900">{{ receipt.merchantName }}</td>
              <td class="px-4 py-3 text-slate-600">
                <div class="font-semibold text-slate-900">{{ receipt.bankCode || receipt.bankName || '—' }}</div>
                <div class="text-[11px] text-slate-400">{{ receipt.blockCode || receipt.placeCode || '—' }}</div>
              </td>
              <td class="px-4 py-3 font-mono font-bold text-emerald-700">{{ money(receipt.amount) }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="receipt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'">
                  {{ receipt.status === 'CANCELLED' ? 'Annulé' : 'Valide' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" @click="openReceipt(receipt)">
                    Détail
                  </button>
                  <button class="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50" :disabled="receipt.status === 'CANCELLED'" @click="cancelReceipt(receipt)">
                    Annuler
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredReceipts.length === 0">
              <td colspan="7" class="px-4 py-6 text-center text-xs text-slate-500">
                Aucun reçu ne correspond aux filtres actifs.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PaginationControls v-model:currentPage="currentPage" :page-size="pageSize" :total-items="filteredReceipts.length" />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PaginationControls from '../common/PaginationControls.vue';
import { marketStore } from '../../store/index.js';
import { formatCurrency } from '../../utils/format.js';

const receipts = computed(() => marketStore.state.receipts || []);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 10;

const filteredReceipts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return receipts.value.filter((receipt) => {
    if (!q) return true;
    return [receipt.receiptNumber, receipt.merchantName, receipt.bankCode, receipt.bankName, receipt.placeCode, receipt.blockCode]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });
});

const paginatedReceipts = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredReceipts.value.slice(start, start + pageSize);
});

function money(value) {
  return formatCurrency(Number(value || 0), 'FBu');
}

function openReceipt(receipt) {
  marketStore.setSelectedReceipt(receipt);
}

async function cancelReceipt(receipt) {
  const reason = window.prompt(`Motif d'annulation pour ${receipt.receiptNumber} :`, 'Correction administrative');
  if (reason === null) return;
  await marketStore.cancelReceipt(receipt.id, reason.trim() || 'Annulation manuelle');
}

watch(searchQuery, () => {
  currentPage.value = 1;
});

watch(filteredReceipts, () => {
  const totalPages = Math.max(1, Math.ceil(filteredReceipts.value.length / pageSize));
  if (currentPage.value > totalPages) currentPage.value = totalPages;
});
</script>
