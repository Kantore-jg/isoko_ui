<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <DataStatePanel
      :loading="state.isLoadingData"
      :error="state.dataError"
      :empty="!state.isLoadingData && !state.dataError && (!state.market || !state.blocks.length)"
      title="Tableau de bord"
      loading-message="Chargement du tableau de bord..."
      error-message="Impossible de charger les indicateurs."
      empty-message="Les indicateurs de synthèse ne sont pas encore disponibles."
    />

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Loyers attendus" :value="money(kpis.expectedMonthly)" helper="Ce mois-ci" tone-class="bg-emerald-50 text-emerald-700">
        <template #icon><DollarSign class="h-5 w-5" /></template>
      </MetricCard>
      <MetricCard label="Loyers encaissés" :value="money(kpis.obtainedMonthly)" :helper="currentMonthLabel" tone-class="bg-blue-50 text-blue-700">
        <template #icon><Receipt class="h-5 w-5" /></template>
      </MetricCard>
      <MetricCard label="Taux d'occupation" :value="`${kpis.occupancyRate}%`" helper="Places occupées" tone-class="bg-amber-50 text-amber-700">
        <template #icon><Grid class="h-5 w-5" /></template>
      </MetricCard>
      <MetricCard label="Commerçants actifs" :value="String(kpis.activeMerchants)" helper="Sur l'ensemble" tone-class="bg-slate-100 text-slate-700">
        <template #icon><Users class="h-5 w-5" /></template>
      </MetricCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
      <div class="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Évolution Financière Mensuelle</h2>
            <p class="text-xs text-slate-500">Vue consolidée {{ currentYear }}</p>
          </div>
          <span class="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Dashboard</span>
        </div>
        <div class="space-y-3">
          <div v-for="trend in monthlyTrends" :key="trend.month" class="grid grid-cols-[70px_1fr_70px] items-center gap-3">
            <span class="text-xs font-semibold text-slate-600">{{ trend.month }}</span>
            <div class="h-3 overflow-hidden bg-slate-100">
              <div class="h-full bg-gradient-to-r from-[#1B2CC1] to-[#ABD2FA]" :style="{ width: `${trend.rate}%` }" />
            </div>
            <span class="text-right text-xs font-bold text-slate-900">{{ trend.rate }}%</span>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-bold text-slate-900">Alertes Loyers</h2>
        <p class="mt-1 text-xs text-slate-500">{{ overdueCount }} impayé(s)</p>
        <div class="mt-4 space-y-3">
          <article
            v-for="item in overdueMerchants.slice(0, 4)"
            :key="item.merchant.id"
            class="rounded-2xl border border-amber-100 bg-amber-50/70 p-3"
          >
            <p class="text-xs font-bold text-slate-900">{{ item.merchant.name }}</p>
            <p class="text-[11px] text-slate-600">{{ item.placeCode }} • {{ item.blockCode }}</p>
            <p class="mt-1 text-[11px] font-semibold text-amber-700">{{ money(item.totalOverdue) }} dû</p>
          </article>
          <p v-if="!overdueMerchants.length" class="text-xs text-slate-500">Aucun impayé détecté.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { DollarSign, Grid, Receipt, Users } from 'lucide-vue-next';
import MetricCard from '../components/common/MetricCard.vue';
import DataStatePanel from '../components/common/DataStatePanel.vue';
import { formatCurrency } from '../utils/format.js';
import { marketStore } from '../store/index.js';

const state           = marketStore.state;
const kpis            = marketStore.kpis;
const monthlyTrends   = marketStore.monthlyTrends;
const overdueCount    = marketStore.overdueCount;
const overdueMerchants = marketStore.overdueMerchants;

const currentYear      = new Date().getFullYear();
const currentMonthLabel = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
});

const money = (value) => formatCurrency(value, 'FBu');
</script>
