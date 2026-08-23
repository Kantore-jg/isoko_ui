<template>
  <div v-if="ready && state" class="relative flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 antialiased">
    <Sidebar
      :items="visibleRoutes"
      :current-tab="activeTab"
      :current-user="state.currentUser"
      :collapsed="state.sidebarCollapsed"
      :role-abbr="roleAbbr"
      @toggle-sidebar="toggleSidebar"
    />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Navbar
        :title="pageTitle"
        :subtitle="pageSubtitle"
        :current-user="state.currentUser"
        :role-abbr="roleAbbr"
        :current-user-title="state.currentUser.title"
        :overdue-count="overdueCount"
        :collapsed="state.sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-role-menu="toggleRoleMenu"
        @toggle-notifications="toggleNotifications"
        @open-payment="openPaymentDrawer"
      />

      <div v-if="showNotifications" class="absolute right-6 top-20 z-40 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 class="text-xs font-semibold text-slate-800">Alertes Loyers</h3>
          <span class="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{{ overdueCount }} impayés</span>
        </div>
        <div class="mt-3 space-y-2 max-h-60 overflow-y-auto">
          <article v-for="item in overdueMerchants.slice(0, 5)" :key="item.merchant.id" class="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p class="text-xs font-semibold text-slate-800">{{ item.merchant.name }}</p>
            <p class="text-[11px] text-slate-500">{{ item.placeCode }} • {{ item.blockCode }}</p>
            <p class="mt-1 text-[11px] font-semibold text-amber-700">{{ money(item.totalOverdue) }} dû</p>
          </article>
          <p v-if="!overdueMerchants.length" class="text-xs text-slate-500">Aucune alerte active.</p>
        </div>
        <button class="mt-3 w-full text-center text-xs font-semibold text-emerald-600 hover:underline" @click="navigate('/finances/rents')">
          Voir tous les loyers
        </button>
      </div>

      <div v-if="showRoleMenu" class="absolute right-6 top-20 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
        <p class="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Changer de rôle</p>
        <button class="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50" @click="changeRole('SUPER_ADMIN')">
          <ShieldCheck class="mt-0.5 h-4 w-4 text-emerald-600" />
          <div>
            <p class="text-xs font-semibold text-slate-800">Super Admin</p>
            <p class="text-[11px] text-slate-500">Observation stratégique & analyse</p>
          </div>
        </button>
        <button class="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50" @click="changeRole('ADMIN')">
          <UserCheck class="mt-0.5 h-4 w-4 text-blue-600" />
          <div>
            <p class="text-xs font-semibold text-slate-800">Admin / Commissaire</p>
            <p class="text-[11px] text-slate-500">Gestion des blocs, places & commerçants</p>
          </div>
        </button>
        <button class="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50" @click="changeRole('ACCOUNTANT')">
          <CreditCard class="mt-0.5 h-4 w-4 text-amber-600" />
          <div>
            <p class="text-xs font-semibold text-slate-800">Chef Comptable</p>
            <p class="text-[11px] text-slate-500">Guichet reçus, loyers & banques</p>
          </div>
        </button>
      </div>

      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div class="mx-auto max-w-7xl space-y-6">
          <section v-if="currentView === 'dashboard-super'" class="space-y-6">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Loyers attendus" :value="money(kpis.expectedMonthly)" helper="Ce mois-ci" tone-class="bg-emerald-50 text-emerald-700">
                <template #icon><DollarSign class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Loyers encaissés" :value="money(kpis.obtainedMonthly)" helper="Août 2026" tone-class="bg-blue-50 text-blue-700">
                <template #icon><Receipt class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Taux d'occupation" :value="`${kpis.occupancyRate}%`" helper="Places occupées" tone-class="bg-amber-50 text-amber-700">
                <template #icon><Grid class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Commerçants actifs" :value="String(kpis.activeMerchants)" helper="Sur l’ensemble" tone-class="bg-slate-100 text-slate-700">
                <template #icon><Users class="h-5 w-5" /></template>
              </MetricCard>
            </div>

            <div class="grid gap-6 xl:grid-cols-3">
              <div class="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                  <div>
                    <h2 class="text-sm font-bold text-slate-900">Évolution Financière Mensuelle</h2>
                    <p class="text-xs text-slate-500">Vue consolidée 2026</p>
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
                  <article v-for="item in overdueMerchants.slice(0, 4)" :key="item.merchant.id" class="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                    <p class="text-xs font-bold text-slate-900">{{ item.merchant.name }}</p>
                    <p class="text-[11px] text-slate-600">{{ item.placeCode }} • {{ item.blockCode }}</p>
                    <p class="mt-1 text-[11px] font-semibold text-amber-700">{{ money(item.totalOverdue) }} dû</p>
                  </article>
                  <p v-if="!overdueMerchants.length" class="text-xs text-slate-500">Aucun impayé détecté.</p>
                </div>
              </div>
            </div>
          </section>

          <AdminDashboard v-else-if="currentView === 'dashboard-admin'" />

          <section v-else-if="currentView === 'dashboard-accountant'" class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
              <MetricCard label="Recouvrement" :value="`${kpis.recoveryRateMonthly.toFixed(0)}%`" helper="Taux du mois" tone-class="bg-emerald-50 text-emerald-700">
                <template #icon><Percent class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Total encaissé" :value="money(kpis.obtainedAnnual)" helper="Exercice 2026" tone-class="bg-blue-50 text-blue-700">
                <template #icon><Wallet class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Impayés" :value="money(kpis.unpaidMonthly)" helper="À recouvrer" tone-class="bg-amber-50 text-amber-700">
                <template #icon><FileWarning class="h-5 w-5" /></template>
              </MetricCard>
            </div>
            <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="text-sm font-bold text-slate-900">Journal paiements récents</h2>
              <div class="mt-4 overflow-hidden">
                <table class="min-w-full divide-y divide-slate-200 text-sm">
                  <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th class="px-4 py-3">Reçu</th>
                      <th class="px-4 py-3">Commerçant</th>
                      <th class="px-4 py-3">Montant</th>
                      <th class="px-4 py-3">Banque</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="payment in state.payments" :key="payment.id">
                      <td class="px-4 py-3 font-semibold text-slate-900">{{ payment.receiptNumber }}</td>
                      <td class="px-4 py-3">{{ payment.merchantName }}</td>
                      <td class="px-4 py-3 font-semibold">{{ money(payment.amount) }}</td>
                      <td class="px-4 py-3">{{ payment.bankCode }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <OccupancyDashboard v-else-if="currentView === 'dashboard-occupancy'" />

          <BlocksList v-else-if="currentView === 'structure-blocks'" />

          <PlacesList v-else-if="currentView === 'structure-places'" />

          <MerchantsList v-else-if="currentView === 'merchants-list'" />

          <AssignmentsList v-else-if="currentView === 'merchants-assignments'" />

          <MovementsList v-else-if="currentView === 'merchants-movements'" />

          <RentObligationsList v-else-if="currentView === 'finances-rents'" />

          <section v-else-if="currentView === 'finances-payments'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Journal paiements & quittances</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Reçu</th>
                    <th class="px-4 py-3">Commerçant</th>
                    <th class="px-4 py-3">Montant</th>
                    <th class="px-4 py-3">Date</th>
                    <th class="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="payment in state.payments" :key="payment.id">
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ payment.receiptNumber }}</td>
                    <td class="px-4 py-3">{{ payment.merchantName }}</td>
                    <td class="px-4 py-3">{{ money(payment.amount) }}</td>
                    <td class="px-4 py-3">{{ payment.paymentDate }}</td>
                    <td class="px-4 py-3">
                      <button class="text-xs font-semibold text-emerald-700 hover:underline" @click="marketStore.setSelectedReceipt(payment)">
                        Voir reçu
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <BanksList v-else-if="currentView === 'finances-banks'" />

          <ExcelManager v-else-if="currentView === 'tools-excel'" />

          <section v-else-if="currentView === 'tools-audit'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Journal d’audit</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Date</th>
                    <th class="px-4 py-3">Action</th>
                    <th class="px-4 py-3">Détails</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="log in state.auditLogs" :key="log.id">
                    <td class="px-4 py-3">{{ log.timestamp }}</td>
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ log.actionLabel }}</td>
                    <td class="px-4 py-3">{{ log.details }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'admin-users'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Utilisateurs & rôles</h2>
            <div class="mt-4 grid gap-4 md:grid-cols-3">
              <article v-for="user in state.users" :key="user.id" class="rounded-2xl border border-slate-200 p-4">
                <p class="text-sm font-bold text-slate-900">{{ user.name }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ user.email }}</p>
                <p class="mt-3 text-[11px] font-semibold text-emerald-600">{{ user.role }}</p>
              </article>
            </div>
          </section>

          <MarketSettings v-else-if="currentView === 'admin-settings'" />
        </div>
      </main>

      <NewPaymentModal />
      <ReceiptModal />
    </div>
  </div>

  <div v-else class="flex h-screen items-center justify-center bg-slate-50 text-slate-600">
    Chargement du tableau de bord...
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Banknote,
  Building2,
  CreditCard,
  DollarSign,
  FileWarning,
  Grid,
  Landmark,
  MapPin,
  Percent,
  Receipt,
  Repeat2,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-vue-next';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';
import MetricCard from './components/common/MetricCard.vue';
import AdminDashboard from './components/dashboard/AdminDashboard.vue';
import OccupancyDashboard from './components/dashboard/OccupancyDashboard.vue';
import ExcelManager from './components/tools/ExcelManager.vue';
import BlocksList from './components/structure/BlocksList.vue';
import PlacesList from './components/structure/PlacesList.vue';
import MerchantsList from './components/merchants/MerchantsList.vue';
import AssignmentsList from './components/merchants/AssignmentsList.vue';
import MovementsList from './components/merchants/MovementsList.vue';
import BanksList from './components/finances/BanksList.vue';
import RentObligationsList from './components/finances/RentObligationsList.vue';
import MarketSettings from './components/settings/MarketSettings.vue';
import NewPaymentModal from './components/finances/NewPaymentModal.vue';
import ReceiptModal from './components/modals/ReceiptModal.vue';
import { getVisibleRoutes, getPathFromTab } from './config/api.js';
import { formatCurrency } from './utils/format.js';
import { marketStore } from './store/index.js';

const route = useRoute();
const router = useRouter();

const state = marketStore.state;
const ready = marketStore.ready;
const showRoleMenu = marketStore.showRoleMenu;
const showNotifications = marketStore.showNotifications;
const currentView = marketStore.currentView;
const pageTitle = marketStore.pageTitle;
const pageSubtitle = marketStore.pageSubtitle;
const overdueCount = marketStore.overdueCount;
const kpis = marketStore.kpis;
const monthlyTrends = marketStore.monthlyTrends;
const overdueMerchants = marketStore.overdueMerchants;
const totalTransactions = marketStore.totalTransactions;
const totalBanked = marketStore.totalBanked;
const roleAbbr = marketStore.roleAbbr;
const activeTab = computed(() => state.activeTab);

const iconForTab = (tab) => {
  if (tab.startsWith('dashboard')) {
    return tab === 'dashboard-accountant' ? DollarSign : tab === 'dashboard-occupancy' ? Grid : MapPin;
  }
  if (tab.includes('blocks')) return Building2;
  if (tab.includes('places')) return MapPin;
  if (tab.includes('merchants')) return Users;
  if (tab.includes('finances')) return DollarSign;
  if (tab.includes('tools')) return Receipt;
  if (tab.includes('admin')) return Users;
  return Users;
};

const visibleRoutes = computed(() =>
  getVisibleRoutes(state.currentUser?.role || 'ACCOUNTANT').map((routeItem) => ({
    ...routeItem,
    icon: iconForTab(routeItem.tab),
    badge:
      routeItem.tab === 'dashboard-super'
        ? 'Boss'
        : routeItem.tab === 'finances-rents' && overdueCount.value > 0
          ? `${overdueCount.value} Impayés`
          : undefined,
  }))
);

const openPaymentDrawer = () => {
  marketStore.setIsNewPaymentModalOpen(true);
  if (route.path !== '/finances/payments') {
    router.push('/finances/payments');
  }
};
const changeRole = (role) => {
  marketStore.changeRole(role);
  router.push(getPathFromTab(state.activeTab));
};
const toggleSidebar = () => marketStore.toggleSidebar();
const toggleRoleMenu = () => marketStore.toggleRoleMenu();
const toggleNotifications = () => marketStore.toggleNotifications();
const onReset = () => marketStore.resetToDefaults();
const money = (value) => formatCurrency(value, 'FBu');

watch(
  () => route.path,
  (path) => {
    marketStore.syncRoute(path);
  },
  { immediate: true }
);
</script>
