import { createRouter, createWebHistory } from 'vue-router';
import { getDefaultTabForRole, getPathFromTab, getTabFromPath, getVisibleRoutes, ROUTES } from '../config/api.js';
import { getStoredToken } from '../services/apiClient.js';
import { marketStore } from '../store/index.js';

// Mapping tab → composant de vue (lazy-loaded)
const VIEW_COMPONENTS = {
  'dashboard-super':      () => import('../views/DashboardSuperView.vue'),
  'dashboard-admin':      () => import('../views/DashboardAdminView.vue'),
  'dashboard-accountant': () => import('../views/DashboardAccountantView.vue'),
  'dashboard-occupancy':  () => import('../views/DashboardOccupancyView.vue'),
  'structure-blocks':     () => import('../views/StructureBlocksView.vue'),
  'structure-places':     () => import('../views/StructurePlacesView.vue'),
  'structure-rent-rates': () => import('../views/StructureRentRatesView.vue'),
  'merchants-list':       () => import('../views/MerchantsListView.vue'),
  'merchants-assignments':() => import('../views/MerchantsAssignmentsView.vue'),
  'merchants-movements':  () => import('../views/MerchantsMovementsView.vue'),
  'finances-rents':       () => import('../views/FinancesRentsView.vue'),
  'finances-payments':    () => import('../views/FinancesPaymentsView.vue'),
  'finances-banks':       () => import('../views/FinancesBanksView.vue'),
  'tools-excel':          () => import('../views/ToolsExcelView.vue'),
  'tools-audit':          () => import('../views/ToolsAuditView.vue'),
  'admin-users':          () => import('../views/AdminUsersView.vue'),
  'admin-settings':       () => import('../views/AdminSettingsView.vue'),
};

const routes = ROUTES.map((route) => ({
  path: route.path,
  name: route.tab,
  component: VIEW_COMPONENTS[route.tab] || (() => import('../views/NotFoundView.vue')),
  meta: { tab: route.tab, roles: route.roles },
}));

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  // Redirige vers login si pas de token et hors de la page racine
  if (!marketStore.state.currentUser && !getStoredToken() && to.path !== '/') {
    return '/';
  }

  // Synchronise l'onglet actif dans le store selon l'URL
  const tab = getTabFromPath(to.path) || to.meta.tab;
  if (tab) {
    marketStore.state.activeTab = tab;
  }

  // Contrôle d'accès par rôle
  const role    = marketStore.state.currentUser?.role || 'SUPER_ADMIN';
  const allowed = to.meta.roles || [];
  if (allowed.length > 0 && !allowed.includes(role)) {
    return getPathFromTab(getDefaultTabForRole(role));
  }

  // Charge les données de la page
  await marketStore.syncRoute(to.path);
  return true;
});

export default router;
