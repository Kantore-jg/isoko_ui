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

      <!-- Panneau Notifications -->
      <div v-if="showNotifications" class="absolute right-6 top-20 z-40 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 class="text-xs font-semibold text-slate-800">Alertes Loyers</h3>
          <span class="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{{ overdueCount }} impayés</span>
        </div>
        <div class="mt-3 max-h-60 space-y-2 overflow-y-auto">
          <article v-for="item in overdueMerchants.slice(0, 5)" :key="item.merchant.id" class="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p class="text-xs font-semibold text-slate-800">{{ item.merchant.name }}</p>
            <p class="text-[11px] text-slate-500">{{ item.placeCode }} • {{ item.blockCode }}</p>
            <p class="mt-1 text-[11px] font-semibold text-amber-700">{{ money(item.totalOverdue) }} dû</p>
          </article>
          <p v-if="!overdueMerchants.length" class="text-xs text-slate-500">Aucune alerte active.</p>
        </div>
        <button class="mt-3 w-full text-center text-xs font-semibold text-emerald-600 hover:underline" @click="router.push('/finances/rents')">
          Voir tous les loyers
        </button>
      </div>

      <!-- Panneau Rôle / Session -->
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

      <!-- Contenu principal — router-view remplace les v-else-if -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <RouterView />
      </main>

      <!-- Modales globales -->
      <NewPaymentModal />
      <ReceiptModal />
    </div>
  </div>

  <Login v-else-if="ready" />

  <div v-else class="flex h-screen items-center justify-center bg-slate-50 text-slate-600">
    Chargement de la session...
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import {
  Building2,
  DollarSign,
  Grid,
  MapPin,
  Receipt,
  Users,
} from 'lucide-vue-next';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';
import Login from './components/auth/Login.vue';
import NewPaymentModal from './components/finances/NewPaymentModal.vue';
import ReceiptModal from './components/modals/ReceiptModal.vue';
import { getTabFromPath, getVisibleRoutes } from './config/api.js';
import { formatCurrency } from './utils/format.js';
import { marketStore } from './store/index.js';

const router = useRouter();
const route = useRoute();

const state            = marketStore.state;
const ready            = marketStore.ready;
const showRoleMenu     = marketStore.showRoleMenu;
const showNotifications = marketStore.showNotifications;
const pageTitle        = marketStore.pageTitle;
const pageSubtitle     = marketStore.pageSubtitle;
const overdueCount     = marketStore.overdueCount;
const overdueMerchants = marketStore.overdueMerchants;
const roleAbbr         = marketStore.roleAbbr;

const activeTab = computed(() => getTabFromPath(route.path));

const iconForTab = (tab) => {
  if (tab.startsWith('dashboard')) {
    return tab === 'dashboard-accountant' ? DollarSign : tab === 'dashboard-occupancy' ? Grid : MapPin;
  }
  if (tab.includes('blocks') || tab.includes('rent-rates')) return Building2;
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

const toggleSidebar     = () => marketStore.toggleSidebar();
const toggleRoleMenu    = () => marketStore.toggleRoleMenu();
const toggleNotifications = () => marketStore.toggleNotifications();

const logout = async () => {
  await marketStore.logout();
  await router.replace('/');
};

const money = (value) => formatCurrency(value, 'FBu');
</script>
