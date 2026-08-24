import { createRouter, createWebHistory } from 'vue-router';
import { getDefaultTabForRole, getPathFromTab, ROUTES } from '../config/api.js';
import { getStoredToken } from '../services/apiClient.js';
import { marketStore } from '../store/index.js';

const RouteStub = {
  template: '<div />',
};

const routes = ROUTES.map((route) => ({
  path: route.path,
  name: route.tab,
  component: RouteStub,
  meta: { tab: route.tab, roles: route.roles },
}));

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (!marketStore.state.currentUser && !getStoredToken() && to.path !== '/') {
    return '/';
  }

  const role = marketStore.state.currentUser?.role || 'SUPER_ADMIN';
  const allowed = to.meta.roles || [];

  if (allowed.length > 0 && !allowed.includes(role)) {
    return getPathFromTab(getDefaultTabForRole(role));
  }

  await marketStore.syncRoute(to.path);
  return true;
});

export default router;
