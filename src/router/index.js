import { createRouter, createWebHistory } from 'vue-router';
import { getDefaultTabForRole, getPathFromTab, getRoutesForUser, ROUTES } from '../config/api.js';
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
  meta: { tab: route.tab, roles: route.roles, permissions: route.permissions || [] },
}));

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function resolveAccessiblePath() {
  const role = marketStore.state.currentUser?.role || 'SUPER_ADMIN';
  const permissions = marketStore.state.currentUser?.permissions || [];
  const accessible = getRoutesForUser(role, permissions);
  return getPathFromTab(accessible[0]?.tab || getDefaultTabForRole(role));
}

router.beforeEach((to) => {
  // Redirige vers login si pas de token et hors de la page racine
  if (!marketStore.state.currentUser && !getStoredToken() && to.path !== '/') {
    return '/';
  }

  const currentUser = marketStore.state.currentUser;

  // Session pas encore hydratée : on ne bloque pas (App.vue attend `ready`)
  if (!currentUser) {
    return undefined;
  }

  // Contrôle d'accès par rôle
  const allowedRoles = to.meta.roles || [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return resolveAccessiblePath();
  }

  // Contrôle d'accès par permissions (au moins une requise suffit)
  const requiredPermissions = to.meta.permissions || [];
  if (requiredPermissions.length > 0) {
    const userPermissions = new Set(currentUser.permissions || []);
    if (!requiredPermissions.some((permission) => userPermissions.has(permission))) {
      return resolveAccessiblePath();
    }
  }
});

router.afterEach((to) => {
  void marketStore.syncRoute(to.path);
});

export default router;
