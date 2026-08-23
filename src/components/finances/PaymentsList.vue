<template>
  <section class="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Journal détaillé des paiements</h2>
        <p class="mt-1 text-xs text-slate-500">Historique des encaissements, allocations et reçus générés.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <input v-model="searchQuery" type="text" placeholder="Rechercher reçu, commerçant, banque..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 md:w-80">
        <button class="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700" @click="marketStore.setIsNewPaymentModalOpen(true)">
          Nouveau paiement
        </button>
      </div>
    </div>

    <DataStatePanel
      :loading="isLoading"
      :error="dataError"
      :empty="filteredPayments.length === 0 && !isLoading && !dataError"
      title="Paiements"
      loading-message="Chargement des paiements..."
      error-message="Impossible de charger les paiements."
      empty-message="Aucun paiement ne correspond aux filtres actifs."
    />

    <div v-if="!isLoading && !dataError && filteredPayments.length > 0" class="overflow-hidden rounded-2xl border border-slate-200">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Reçu</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Commerçant</th>
              <th class="px-4 py-3">Affectation</th>
              <th class="px-4 py-3">Banque</th>
              <th class="px-4 py-3 text-right">Montant</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="payment in paginatedPayments" :key="payment.id" class="hover:bg-slate-50/80">
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ payment.referenceNumber }}</td>
              <td class="px-4 py-3 font-mono text-slate-500">{{ payment.paymentDate }}</td>
              <td class="px-4 py-3 font-semibold text-slate-900">{{ payment.merchantName }}</td>
              <td class="px-4 py-3 text-slate-600">
                <div class="font-mono font-semibold text-slate-900">{{ payment.placeCode || '—' }}</div>
                <div class="text-[11px] text-slate-400">{{ payment.periodLabel || 'Période non précisée' }}</div>
              </td>
              <td class="px-4 py-3 text-slate-600">
                <div class="font-semibold text-slate-900">{{ payment.bankCode || payment.bankName || '—' }}</div>
                <div class="text-[11px] text-slate-400">{{ payment.recordedBy || '—' }}</div>
              </td>
              <td class="px-4 py-3 text-right font-mono font-bold text-emerald-700">{{ money(payment.amount) }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="payment.status === 'VOIDED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'">
                  {{ payment.status === 'VOIDED' ? 'Annulé' : 'Posté' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" @click="openReceipt(payment)">
                    Reçu
                  </button>
                  <button class="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50" :disabled="payment.status === 'VOIDED'" @click="voidPayment(payment)">
                    Annuler
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PaginationControls
      v-if="!isLoading && !dataError && filteredPayments.length > 0"
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total-items="filteredPayments.length"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PaginationControls from '../common/PaginationControls.vue';
import DataStatePanel from '../common/DataStatePanel.vue';
import { marketStore } from '../../store/index.js';
import { formatCurrency } from '../../utils/format.js';

const payments = computed(() => marketStore.state.payments || []);
const isLoading = computed(() => marketStore.state.isLoadingData);
const dataError = computed(() => marketStore.state.dataError || '');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 10;

const filteredPayments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return payments.value.filter((payment) => {
    if (!q) return true;
    return [payment.referenceNumber, payment.merchantName, payment.bankCode, payment.bankName, payment.placeCode, payment.periodLabel]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });
});

const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredPayments.value.slice(start, start + pageSize);
});

function money(value) {
  return formatCurrency(Number(value || 0), 'FBu');
}

function openReceipt(payment) {
  marketStore.setSelectedReceipt(payment);
}

async function voidPayment(payment) {
  const reason = window.prompt(`Motif d'annulation pour ${payment.referenceNumber} :`, 'Erreur de saisie');
  if (reason === null) return;
  await marketStore.voidPayment(payment.id, reason.trim() || 'Annulation manuelle');
}

watch(searchQuery, () => {
  currentPage.value = 1;
});

watch(filteredPayments, () => {
  const totalPages = Math.max(1, Math.ceil(filteredPayments.value.length / pageSize));
  if (currentPage.value > totalPages) currentPage.value = totalPages;
});
</script>
