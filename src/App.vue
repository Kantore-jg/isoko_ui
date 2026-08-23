<template>
  <div v-if="ready && state.currentUser" class="relative flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 antialiased">
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
        <p class="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Session</p>
        <div class="rounded-xl bg-slate-50 px-3 py-3">
          <p class="text-xs font-semibold text-slate-800">{{ state.currentUser.name }}</p>
          <p class="text-[11px] text-slate-500">{{ state.currentUser.title }}</p>
          <p class="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{{ state.currentUser.role }}</p>
        </div>
        <button class="mt-2 flex w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50" @click="logout">
          Se déconnecter
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

          <AccountantDashboard v-else-if="currentView === 'dashboard-accountant'" />

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

          <UsersManager v-else-if="currentView === 'admin-users'" />

          <MarketSettings v-else-if="currentView === 'admin-settings'" />
        </div>
      </main>

      <NewPaymentModal />
      <ReceiptModal />
    </div>
  </div>

  <div v-else-if="ready" class="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 text-slate-700">
    <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
      <div class="mb-6 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-[#1B2CC1] text-2xl font-bold text-white">M</div>
        <h1 class="text-xl font-bold text-slate-900">Connexion API</h1>
        <p class="mt-1 text-sm text-slate-500">Connectez-vous pour charger les données du backend Laravel.</p>
      </div>

      <form class="space-y-4" @submit.prevent="submitLogin">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-700">Identifiant</span>
          <input v-model="loginForm.login" type="text" class="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none" autocomplete="username" required>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-700">Mot de passe</span>
          <input v-model="loginForm.password" type="password" class="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none" autocomplete="current-password" required>
        </label>

        <p v-if="loginError" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{{ loginError }}</p>

        <button type="submit" :disabled="isLoggingIn" class="w-full rounded-xl bg-[#1B2CC1] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#152399] disabled:cursor-not-allowed disabled:opacity-60">
          {{ isLoggingIn ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>

  <div v-else class="flex h-screen items-center justify-center bg-slate-50 text-slate-600">
    Chargement de la session...
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Banknote,
  Building2,
  DollarSign,
  FileWarning,
  Grid,
  Landmark,
  MapPin,
  Percent,
  Receipt,
  Repeat2,
  Users,
  Wallet,
} from 'lucide-vue-next';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';
import MetricCard from './components/common/MetricCard.vue';
import AdminDashboard from './components/dashboard/AdminDashboard.vue';
import OccupancyDashboard from './components/dashboard/OccupancyDashboard.vue';
import ExcelManager from './components/tools/ExcelManager.vue';
import AccountantDashboard from './components/dashboard/AccountantDashboard.vue';
import BlocksList from './components/structure/BlocksList.vue';
import PlacesList from './components/structure/PlacesList.vue';
import MerchantsList from './components/merchants/MerchantsList.vue';
import AssignmentsList from './components/merchants/AssignmentsList.vue';
import MovementsList from './components/merchants/MovementsList.vue';
import BanksList from './components/finances/BanksList.vue';
import RentObligationsList from './components/finances/RentObligationsList.vue';
import MarketSettings from './components/settings/MarketSettings.vue';
import UsersManager from './components/users/UsersManager.vue';
import NewPaymentModal from './components/finances/NewPaymentModal.vue';
import ReceiptModal from './components/modals/ReceiptModal.vue';
import { getVisibleRoutes } from './config/api.js';
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
const loginForm = reactive({
  login: '',
  password: '',
});
const isLoggingIn = ref(false);
const loginError = ref('');

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

const toggleSidebar = () => marketStore.toggleSidebar();
const toggleRoleMenu = () => marketStore.toggleRoleMenu();
const toggleNotifications = () => marketStore.toggleNotifications();
const onReset = () => marketStore.resetToDefaults();
const logout = async () => {
  await marketStore.logout();
  await router.replace('/');
};
const money = (value) => formatCurrency(value, 'FBu');

async function submitLogin() {
  isLoggingIn.value = true;
  loginError.value = '';

  try {
    await marketStore.login({
      login: loginForm.login,
      password: loginForm.password,
    });
    await router.replace('/dashboard');
  } catch (error) {
    loginError.value = error?.message || 'Connexion impossible.';
  } finally {
    isLoggingIn.value = false;
  }
}

watch(
  () => route.path,
  (path) => {
    marketStore.syncRoute(path);
  },
  { immediate: true }
);
</script>
