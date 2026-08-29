const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

// permissions : liste de permissions donnant accès à la page (au moins une suffit).
// Doit rester aligné avec resourcePermissionMap (store) et les middleware 'permission:' du backend.
export const ROUTES = [
  { path: '/', tab: 'dashboard-super', label: 'Vue Globale', roles: ['SUPER_ADMIN', 'ADMIN'], showInSidebar: false },
  { path: '/dashboard', tab: 'dashboard-super', label: 'Vue Globale', roles: ['SUPER_ADMIN', 'ADMIN'], showInSidebar: true, permissions: ['dashboard.view'] },
  { path: '/dashboard/admin', tab: 'dashboard-admin', label: 'Gestion Opérationnelle', roles: ['SUPER_ADMIN', 'ADMIN'], permissions: ['reports.view'] },
  { path: '/dashboard/accounting', tab: 'dashboard-accountant', label: 'Finance & Caisse', roles: ['SUPER_ADMIN', 'ACCOUNTANT'], permissions: ['payments.manage'] },
  { path: '/dashboard/occupancy', tab: 'dashboard-occupancy', label: 'Plan 2D & Occupation', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['places.manage'] },
  { path: '/structure/blocks', tab: 'structure-blocks', label: 'Blocs & Tarifs', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['blocks.manage'] },
  { path: '/structure/places', tab: 'structure-places', label: 'Places du Marché', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['places.manage'] },
  { path: '/structure/rent-rates', tab: 'structure-rent-rates', label: 'Tarifs de Loyer', roles: ['SUPER_ADMIN', 'ADMIN'], permissions: ['rents.manage'] },
  { path: '/merchants', tab: 'merchants-list', label: 'Commerçants', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['merchants.manage'] },
  { path: '/merchants/assignments', tab: 'merchants-assignments', label: 'Affectations Actives', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['assignments.manage'] },
  { path: '/merchants/movements', tab: 'merchants-movements', label: 'Mouvements & Historique', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['reports.view'] },
  { path: '/finances/rents', tab: 'finances-rents', label: 'Loyers & Reçus', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['rents.manage'] },
  { path: '/finances/payments', tab: 'finances-payments', label: 'Journal Paiements', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['payments.manage'] },
  { path: '/finances/banks', tab: 'finances-banks', label: 'Analyse Banques', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['banks.manage'] },
  { path: '/tools/excel', tab: 'tools-excel', label: 'Import / Export Excel', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['imports.manage', 'exports.manage'] },
  { path: '/tools/audit', tab: 'tools-audit', label: "Journal d'Audit", roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], permissions: ['reports.view'] },
  { path: '/admin/users', tab: 'admin-users', label: 'Utilisateurs & Rôles', roles: ['SUPER_ADMIN', 'ADMIN'], permissions: ['users.manage'] },
  { path: '/admin/settings', tab: 'admin-settings', label: 'Paramètres Marché', roles: ['SUPER_ADMIN', 'ADMIN'], permissions: ['settings.manage'] },
];

export const TAB_TO_PATH = Object.fromEntries(ROUTES.map((route) => [route.tab, route.path]));
export const PATH_TO_TAB = Object.fromEntries(ROUTES.map((route) => [route.path, route.tab]));

export const ROLE_DEFAULT_TAB = {
  SUPER_ADMIN: 'dashboard-super',
  ADMIN: 'dashboard-admin',
  ACCOUNTANT: 'dashboard-accountant',
};

export function getTabFromPath(pathname) {
  return PATH_TO_TAB[pathname] || 'dashboard-super';
}

export function getPathFromTab(tab) {
  return TAB_TO_PATH[tab] || '/';
}

export function getVisibleRoutes(role) {
  return ROUTES.filter((route) => route.roles.includes(role) && route.showInSidebar !== false);
}

export function routeRequiresPermissions(route, permissions = []) {
  if (!route.permissions || route.permissions.length === 0) {
    return false;
  }

  const permissionSet = permissions instanceof Set ? permissions : new Set(permissions);
  return !route.permissions.some((permission) => permissionSet.has(permission));
}

// Filtre les routes selon le rôle ET les permissions de l'utilisateur connecté.
export function getRoutesForUser(role, permissions = []) {
  return getVisibleRoutes(role).filter((route) => !routeRequiresPermissions(route, permissions));
}

export function getDefaultTabForRole(role) {
  return ROLE_DEFAULT_TAB[role] || 'dashboard-super';
}

export function getRouteLabel(tab) {
  return ROUTES.find((route) => route.tab === tab)?.label || 'Vue Globale';
}

export function getMonthNames() {
  return monthNames.slice();
}
