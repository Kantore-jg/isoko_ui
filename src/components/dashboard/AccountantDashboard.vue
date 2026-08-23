<template>
  <section class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="CA Encaissé (Ce Mois)"
        :value="moneyMillions(kpis.obtainedMonthly)"
        helper="Sur le mois en cours"
        tone-class="bg-emerald-50 text-emerald-700"
      >
        <template #icon><DollarSign class="h-5 w-5" /></template>
      </MetricCard>

      <MetricCard
        label="Reste à Encaisser"
        :value="moneyMillions(kpis.unpaidMonthly)"
        :helper="`Loyers en attente ou échus • ${overdueCount} impayés`"
        tone-class="bg-amber-50 text-amber-700"
      >
        <template #icon><AlertCircle class="h-5 w-5" /></template>
      </MetricCard>

      <MetricCard
        label="Cumul Encaissé (2026)"
        :value="moneyMillions(kpis.obtainedAnnual)"
        helper="Total des quittances validées"
        tone-class="bg-blue-50 text-blue-700"
      >
        <template #icon><FileSpreadsheet class="h-5 w-5" /></template>
      </MetricCard>

      <MetricCard
        label="Reçus Délivrés"
        :value="String(payments.length)"
        helper="Toutes banques confondues"
        tone-class="bg-slate-100 text-slate-700"
      >
        <template #icon><Receipt class="h-5 w-5" /></template>
      </MetricCard>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wide text-slate-800">
            Encaissements par Banque Partenaire
          </h3>
          <p class="text-xs text-slate-400">Comptes receveurs des loyers municipaux</p>
        </div>
        <button class="text-xs font-semibold text-blue-600 hover:underline" @click="navigate('/finances/banks')">
          Détail des comptes
        </button>
      </div>

      <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button
          v-for="bank in banks"
          :key="bank.id"
          class="rounded-xl border p-3 text-left transition-all"
          :class="bankFilter === bank.id ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50 hover:border-slate-300'"
          @click="bankFilter = bankFilter === bank.id ? 'ALL' : bank.id"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-900">{{ bank.code }}</span>
            <Landmark class="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p class="mt-1 font-mono text-sm font-bold text-slate-900">{{ money(bank.totalCollected) }}</p>
          <p class="mt-0.5 text-[10px] text-slate-500">{{ bank.transactionCount }} quittances</p>
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-sm font-bold uppercase tracking-wide text-slate-800">
            Journal des Quittances & Reçus Bancaires
          </h2>
          <p class="text-xs text-slate-400">Filtrage par référence bancaire et impression</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="bankFilter"
            class="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="ALL">Toutes les banques</option>
            <option v-for="bank in banks" :key="bank.id" :value="bank.id">
              {{ bank.code }}
            </option>
          </select>

          <div class="relative w-full md:w-60">
            <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchRef"
              type="text"
              placeholder="N° Reçu / Réf. banque..."
              class="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
          </div>

          <button
            class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
            @click="marketStore.setIsNewPaymentModalOpen(true)"
          >
            <PlusCircle class="h-3.5 w-3.5" />
            <span>Nouveau Paiement</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs">
          <thead class="border-b border-slate-100 bg-slate-50">
            <tr>
              <th class="p-3 font-semibold text-slate-500">N° Reçu / Réf</th>
              <th class="p-3 font-semibold text-slate-500">Date</th>
              <th class="p-3 font-semibold text-slate-500">Commerçant</th>
              <th class="p-3 font-semibold text-slate-500">Place</th>
              <th class="p-3 font-semibold text-slate-500">Période</th>
              <th class="p-3 font-semibold text-slate-500">Banque & Réf.</th>
              <th class="p-3 text-right font-semibold text-slate-500">Montant</th>
              <th class="p-3 text-center font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="payment in paginatedPayments" :key="payment.id" class="transition-colors hover:bg-slate-50">
              <td class="p-3">
                <span class="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-900">
                  {{ payment.referenceNumber }}
                </span>
              </td>
              <td class="p-3 font-mono text-slate-500">{{ payment.paymentDate }}</td>
              <td class="p-3 font-medium text-slate-900">{{ payment.merchantName }}</td>
              <td class="p-3 font-mono font-semibold text-slate-700">{{ payment.placeCode }}</td>
              <td class="p-3 text-slate-700">{{ payment.periodLabel }}</td>
              <td class="p-3">
                <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800">
                  {{ payment.bankCode }}
                </span>
                <span class="ml-1.5 font-mono text-[10px] text-slate-400">
                  {{ payment.bankReferenceNumber || payment.referenceNumber }}
                </span>
              </td>
              <td class="p-3 text-right font-mono font-bold text-emerald-700">
                {{ money(payment.amount) }}
              </td>
              <td class="p-3 text-center">
                <button
                  class="mx-auto flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  @click="marketStore.setSelectedReceipt(payment)"
                >
                  <Printer class="h-3 w-3 text-slate-500" />
                  <span>Reçu</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredPayments.length === 0">
              <td colspan="8" class="p-6 text-center text-xs text-slate-500">
                Aucun paiement ne correspond aux filtres actifs.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationControls v-model:currentPage="currentPage" :page-size="pageSize" :total-items="filteredPayments.length" />
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  AlertCircle,
  DollarSign,
  FileSpreadsheet,
  Landmark,
  PlusCircle,
  Printer,
  Receipt,
  Search,
} from 'lucide-vue-next';
import MetricCard from '../common/MetricCard.vue';
import PaginationControls from '../common/PaginationControls.vue';
import { marketStore } from '../../store/index.js';
import { formatCurrency } from '../../utils/format.js';

const router = useRouter();
const kpis = marketStore.kpis;
const payments = computed(() => marketStore.state.payments || []);
const banks = computed(() => marketStore.state.banks || []);
const obligations = computed(() => marketStore.state.obligations || []);

const bankFilter = ref('ALL');
const searchRef = ref('');
const currentPage = ref(1);
const pageSize = 10;

const filteredPayments = computed(() => {
  const query = searchRef.value.trim().toLowerCase();
  return payments.value.filter((payment) => {
    const matchBank = bankFilter.value === 'ALL' || payment.bankId === bankFilter.value || payment.bankCode === bankFilter.value;
    const matchSearch =
      !query ||
      [payment.referenceNumber, payment.merchantName, payment.placeCode, payment.bankReferenceNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    return matchBank && matchSearch;
  });
});

const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredPayments.value.slice(start, start + pageSize);
});

const overdueCount = computed(() => obligations.value.filter((obligation) => obligation.status === 'OVERDUE').length);

function money(value) {
  return formatCurrency(Number(value || 0), 'FBu');
}

function moneyMillions(value) {
  const amount = Number(value || 0);
  return `${(amount / 1000000).toFixed(1)}M FBu`;
}

function navigate(path) {
  router.push(path);
}

watch([bankFilter, searchRef], () => {
  currentPage.value = 1;
});

watch(filteredPayments, () => {
  const totalPages = Math.max(1, Math.ceil(filteredPayments.value.length / pageSize));
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages;
  }
});
</script>
