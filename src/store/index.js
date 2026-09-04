/**
 * Store principal — façade qui orchestre les sous-stores par domaine.
 *
 * Les composants existants continuent d'utiliser `marketStore.state.xxx`
 * et `marketStore.addBlock(...)` sans modification.
 *
 * Sous-stores disponibles pour import direct :
 *   - useAuthStore     (auth, session)
 *   - useUiStore       (navigation, modals, UI)
 *   - useStructureStore (blocks, places)
 *   - useMerchantsStore (merchants, assignments, movements)
 *   - useFinanceStore   (obligations, banks, payments, receipts)
 *   - useAdminStore     (users, roles, permissions, audit, settings)
 */
import { computed, reactive, ref } from 'vue';
import { createPinia, defineStore, setActivePinia } from 'pinia';
import {
  getDefaultTabForRole,
  getMonthNames,
  getPathFromTab,
  getRouteLabel,
  getRoutesForUser,
  getTabFromPath,
} from '../config/api.js';
import { getStoredToken, setStoredToken, downloadBlob } from '../services/apiClient.js';
import {
  dashboardSummaryApi,
  listApi,
  listBanksApi,
  listMerchantsApi,
  listPaymentsApi,
  listReceiptsApi,
  listRolesApi,
  listUsersApi,
  listPermissionsApi,
  settingsApi,
} from '../services/marketApi.js';
import {
  mapAssignment,
  mapAuditLog,
  mapBank,
  mapBlock,
  mapCurrentUser,
  mapMarket,
  mapMerchant,
  mapMovement,
  mapObligation,
  mapPayment,
  mapPlace,
  mapPermission,
  mapReceipt,
  mapRole,
} from '../services/apiMappers.js';

import { useAuthStore } from './auth.js';
import { useUiStore } from './ui.js';
import { useStructureStore } from './structure.js';
import { useMerchantsStore } from './merchants.js';
import { useFinanceStore } from './finance.js';
import { useAdminStore } from './admin.js';

export { useAuthStore } from './auth.js';
export { useUiStore } from './ui.js';
export { useStructureStore } from './structure.js';
export { useMerchantsStore } from './merchants.js';
export { useFinanceStore } from './finance.js';
export { useAdminStore } from './admin.js';

export const pinia = createPinia();
setActivePinia(pinia);

const useMarketStore = defineStore('market', () => {
  const authStore = useAuthStore();
  const uiStore = useUiStore();
  const structureStore = useStructureStore();
  const merchantsStore = useMerchantsStore();
  const financeStore = useFinanceStore();
  const adminStore = useAdminStore();

  const monthNames = getMonthNames();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  let lastLoadedPath = '';
  const responseCache = Object.create(null);

  // État réactif façade — rétro-compatible avec `marketStore.state.xxx`
  const state = reactive({
    get currentUser() { return authStore.currentUser; },
    set currentUser(v) { authStore.setUser(v); },
    get activeTab() { return uiStore.activeTab; },
    set activeTab(v) { uiStore.setActiveTab(v); },
    get sidebarCollapsed() { return uiStore.sidebarCollapsed; },
    set sidebarCollapsed(v) { uiStore.sidebarCollapsed = v; },
    get market() { return adminStore.market; },
    set market(v) { adminStore.setMarket(v); },
    get dashboardSummary() { return adminStore.dashboardSummary; },
    set dashboardSummary(v) { adminStore.setDashboardSummary(v); },
    get settings() { return adminStore.settings; },
    set settings(v) { adminStore.setSettings(v); },
    get users() { return adminStore.users; },
    set users(v) { adminStore.setUsers(v); },
    get roles() { return adminStore.roles; },
    set roles(v) { adminStore.setRoles(v); },
    get permissions() { return adminStore.permissions; },
    set permissions(v) { adminStore.setPermissions(v); },
    get blocks() { return structureStore.blocks; },
    set blocks(v) { structureStore.setBlocks(v); },
    get places() { return structureStore.places; },
    set places(v) { structureStore.setPlaces(v); },
    get merchants() { return merchantsStore.merchants; },
    set merchants(v) { merchantsStore.setMerchants(v); },
    get assignments() { return merchantsStore.assignments; },
    set assignments(v) { merchantsStore.setAssignments(v); },
    get movements() { return merchantsStore.movements; },
    set movements(v) { merchantsStore.setMovements(v); },
    get obligations() { return financeStore.obligations; },
    set obligations(v) { financeStore.setObligations(v); },
    get banks() { return financeStore.banks; },
    set banks(v) { financeStore.setBanks(v); },
    get payments() { return financeStore.payments; },
    set payments(v) { financeStore.setPayments(v); },
    get receipts() { return financeStore.receipts; },
    set receipts(v) { financeStore.setReceipts(v); },
    get auditLogs() { return adminStore.auditLogs; },
    set auditLogs(v) { adminStore.setAuditLogs(v); },
    get selectedReceipt() { return uiStore.selectedReceipt; },
    set selectedReceipt(v) { uiStore.setSelectedReceipt(v); },
    get isNewPaymentModalOpen() { return uiStore.isNewPaymentModalOpen; },
    set isNewPaymentModalOpen(v) { uiStore.setIsNewPaymentModalOpen(v); },
    get isLoadingData() { return uiStore.isLoadingData; },
    set isLoadingData(v) { uiStore.setLoading(v); },
    get dataError() { return uiStore.dataError; },
    set dataError(v) { uiStore.setDataError(v); },
    get authError() { return authStore.authError; },
    set authError(v) { authStore.authError = v; },
    get authToken() { return authStore.authToken; },
    set authToken(v) { authStore.authToken = v; },
  });

  const ready = computed(() => authStore.ready);
  const searchQuery = computed({
    get: () => uiStore.searchQuery,
    set: (value) => { uiStore.searchQuery = value; },
  });
  const showRoleMenu = computed({
    get: () => uiStore.showRoleMenu,
    set: (value) => { uiStore.showRoleMenu = value; },
  });
  const showNotifications = computed({
    get: () => uiStore.showNotifications,
    set: (value) => { uiStore.showNotifications = value; },
  });

  // Maps de permissions et ressources par page (inchangé)
  const resourcePermissionMap = {
    dashboardSummary: ['dashboard.view', 'reports.view'],
    movements: ['reports.view'],
    auditLogs: ['reports.view'],
    blocks: ['blocks.manage'],
    places: ['places.manage'],
    merchants: ['merchants.manage'],
    assignments: ['assignments.manage'],
    obligations: ['rents.manage'],
    banks: ['banks.manage'],
    payments: ['payments.manage'],
    receipts: ['receipts.manage'],
    users: ['users.manage'],
    roles: ['roles.manage'],
    permissions: ['permissions.manage'],
    settings: ['settings.manage'],
  };

  const sharedResources = ['market'];
  const pageResourceMap = {
    'dashboard-super': ['dashboardSummary', 'blocks', 'places', 'merchants', 'assignments', 'movements', 'obligations', 'banks', 'payments', 'receipts'],
    'dashboard-admin': ['dashboardSummary', 'blocks', 'places', 'merchants', 'assignments', 'movements'],
    'dashboard-accountant': ['dashboardSummary', 'obligations', 'banks', 'payments', 'receipts'],
    'dashboard-occupancy': ['dashboardSummary', 'blocks', 'places', 'merchants', 'assignments', 'movements', 'obligations'],
    'structure-blocks': ['blocks', 'places'],
    'structure-places': ['blocks', 'places', 'merchants', 'assignments'],
    'structure-rent-rates': ['blocks', 'places'],
    'merchants-list': ['merchants', 'places', 'assignments', 'payments'],
    'merchants-assignments': ['assignments', 'places', 'merchants'],
    'merchants-movements': ['movements', 'places', 'merchants'],
    'finances-rents': ['obligations', 'payments', 'receipts', 'banks', 'merchants', 'places', 'assignments'],
    'finances-payments': ['payments', 'banks', 'obligations', 'merchants', 'places'],
    'finances-banks': ['banks', 'payments'],
    'tools-excel': ['blocks', 'places', 'merchants', 'assignments', 'payments', 'obligations', 'banks', 'receipts'],
    'tools-audit': ['auditLogs'],
    'admin-users': ['users'],
    'admin-settings': ['settings'],
  };

  const resourceLoaders = {
    currentUser: (options = {}) => (options.currentUser ? Promise.resolve({ user: options.currentUser }) : (async () => { const { meApi } = await import('../services/marketApi.js'); return meApi(); })()),
    market: settingsApi,
    dashboardSummary: dashboardSummaryApi,
    blocks: () => listApi('blocks', { per_page: 1000 }),
    places: () => listApi('places', { per_page: 1000 }),
    merchants: () => listMerchantsApi({ per_page: 1000 }),
    assignments: () => listApi('assignments', { per_page: 1000 }),
    movements: () => listApi('movements', { per_page: 1000 }),
    obligations: () => listApi('rent-obligations', { per_page: 1000 }),
    banks: () => listBanksApi({ per_page: 1000 }),
    payments: () => listPaymentsApi({ per_page: 1000 }),
    receipts: () => listReceiptsApi({ per_page: 1000 }),
    users: () => listUsersApi({ per_page: 1000 }),
    roles: () => listRolesApi({ per_page: 1000 }),
    permissions: () => listPermissionsApi({ per_page: 1000 }),
    auditLogs: () => listApi('audit-logs', { per_page: 1000 }),
  };

  const resourceFallbacks = {
    currentUser: { user: null },
    market: { market: null, settings: [] },
    dashboardSummary: { summary: {} },
    blocks: { data: [] },
    places: { data: [] },
    merchants: { data: [] },
    assignments: { data: [] },
    movements: { data: [] },
    obligations: { data: [] },
    banks: { data: [] },
    payments: { data: [] },
    receipts: { data: [] },
    users: { data: [] },
    roles: { data: [] },
    permissions: { data: [] },
    auditLogs: { data: [] },
  };

  function canLoadResource(resource, permissions) {
    const requiredPermissions = resourcePermissionMap[resource];
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) => permissions.has(permission));
  }

  function getPageResources(tab, permissions = new Set()) {
    const resources = [...(pageResourceMap[tab] || [])];
    if (tab === 'admin-users') {
      if (permissions.has('roles.manage')) resources.push('roles');
      if (permissions.has('permissions.manage')) resources.push('permissions');
    }
    return [...new Set([...resources, ...sharedResources])].filter((r) => canLoadResource(r, permissions));
  }

  function hasCachedResponse(resource) {
    return Object.prototype.hasOwnProperty.call(responseCache, resource);
  }

  function listData(response) {
    if (Array.isArray(response)) return response;
    return response?.data || [];
  }

  function persist() {
    try {
      window.localStorage.setItem('market-management-ui-state', JSON.stringify({
        currentUser: authStore.currentUser,
        activeTab: uiStore.activeTab,
        sidebarCollapsed: uiStore.sidebarCollapsed,
        market: adminStore.market,
        dashboardSummary: adminStore.dashboardSummary,
        settings: adminStore.settings,
        users: adminStore.users,
        roles: adminStore.roles,
        permissions: adminStore.permissions,
        blocks: structureStore.blocks,
        places: structureStore.places,
        merchants: merchantsStore.merchants,
        assignments: merchantsStore.assignments,
        movements: merchantsStore.movements,
        obligations: financeStore.obligations,
        banks: financeStore.banks,
        payments: financeStore.payments,
        receipts: financeStore.receipts,
        auditLogs: adminStore.auditLogs,
        isLoadingData: uiStore.isLoadingData,
      }));
    } catch {
      //
    }
  }

  function applyApiState(payload) {
    if (payload.currentUser !== undefined) authStore.setUser(payload.currentUser);
    if (payload.market !== undefined) adminStore.setMarket(payload.market);
    if (payload.dashboardSummary !== undefined) adminStore.setDashboardSummary(payload.dashboardSummary || null);
    if (payload.settings !== undefined) adminStore.setSettings(payload.settings || []);
    if (payload.users !== undefined) adminStore.setUsers(payload.users || []);
    if (payload.roles !== undefined) adminStore.setRoles(payload.roles || []);
    if (payload.permissions !== undefined) adminStore.setPermissions(payload.permissions || []);
    if (payload.blocks !== undefined) structureStore.setBlocks(payload.blocks || []);
    if (payload.places !== undefined) structureStore.setPlaces(payload.places || []);
    if (payload.merchants !== undefined) merchantsStore.setMerchants(payload.merchants || []);
    if (payload.assignments !== undefined) merchantsStore.setAssignments(payload.assignments || []);
    if (payload.movements !== undefined) merchantsStore.setMovements(payload.movements || []);
    if (payload.obligations !== undefined) financeStore.setObligations(payload.obligations || []);
    if (payload.banks !== undefined) financeStore.setBanks(payload.banks || []);
    if (payload.payments !== undefined) financeStore.setPayments(payload.payments || []);
    if (payload.receipts !== undefined) financeStore.setReceipts(payload.receipts || []);
    if (payload.auditLogs !== undefined) adminStore.setAuditLogs(payload.auditLogs || []);

    uiStore.setActiveTab(getTabFromPath(window.location.pathname));
    const role = authStore.currentUser?.role || 'SUPER_ADMIN';
    const permissions = authStore.currentUser?.permissions || [];
    if (!getRoutesForUser(role, permissions).some((route) => route.tab === uiStore.activeTab)) {
      uiStore.setActiveTab(getDefaultTabForRole(role));
    }
  }

  async function loadBootstrapData(options = {}) {
    const force = options.force ?? false;
    const tab = options.tab || uiStore.activeTab || getTabFromPath(window.location.pathname);
    const issues = [];
    const responses = {};
    const safe = async (loader, fallback, label) => {
      try { return { ok: true, value: await loader() }; }
      catch (error) { issues.push({ label, message: error?.message || 'Erreur inconnue.' }); return { ok: false, value: fallback }; }
    };

    const meResponse = options.currentUser
      ? { user: options.currentUser }
      : await safe(() => resourceLoaders.currentUser(options), resourceFallbacks.currentUser, 'currentUser');
    responses.currentUser = meResponse;

    const currentUserPayload = meResponse?.value || meResponse;
    const resolvedCurrentUser = options.currentUser || mapCurrentUser(currentUserPayload?.user);
    const permissionSet = new Set(resolvedCurrentUser?.permissions || []);
    const resourcesToLoad = getPageResources(tab, permissionSet).filter((r) => force || !hasCachedResponse(r));

    for (const resource of getPageResources(tab, permissionSet)) {
      if (resource === 'market' || resource === 'currentUser') continue;
      if (!resourcesToLoad.includes(resource)) responses[resource] = responseCache[resource];
    }
    responses.market = responseCache.market || null;

    await Promise.all(resourcesToLoad.map(async (resource) => {
      const loader = resourceLoaders[resource];
      if (!loader) return;
      const result = await safe(loader, resourceFallbacks[resource], resource);
      responses[resource] = result.value;
      if (result.ok) responseCache[resource] = result.value;
      else delete responseCache[resource];
    }));

    const currentUserResponse = responses.currentUser?.value || responses.currentUser || resourceFallbacks.currentUser;
    const settingsResponse = responses.market || resourceFallbacks.market;
    const summaryResponse = responses.dashboardSummary || resourceFallbacks.dashboardSummary;

    const assignments = listData(responses.assignments || resourceFallbacks.assignments).map(mapAssignment);
    const places = listData(responses.places || resourceFallbacks.places).map(mapPlace);
    const merchants = listData(responses.merchants || resourceFallbacks.merchants).map(mapMerchant);
    const payments = listData(responses.payments || resourceFallbacks.payments).map(mapPayment);
    const receipts = listData(responses.receipts || resourceFallbacks.receipts).map(mapReceipt);
    const banks = listData(responses.banks || resourceFallbacks.banks).map(mapBank);
    const obligations = listData(responses.obligations || resourceFallbacks.obligations).map(mapObligation);
    const movements = listData(responses.movements || resourceFallbacks.movements).map(mapMovement);
    const users = listData(responses.users || resourceFallbacks.users).map(mapCurrentUser);
    const roles = listData(responses.roles || resourceFallbacks.roles).map(mapRole);
    const permissionsList = listData(responses.permissions || resourceFallbacks.permissions).map(mapPermission);
    const auditLogs = listData(responses.auditLogs || resourceFallbacks.auditLogs).map(mapAuditLog);

    const balanceDueByMerchant = obligations.reduce((acc, o) => {
      const key = String(o.merchantId || '');
      acc.set(key, (acc.get(key) || 0) + Number(o.balance || 0));
      return acc;
    }, new Map());

    const activeAssignmentsByPlace = new Map(
      assignments.filter((a) => a.status === 'ACTIVE').map((a) => [a.placeId, a])
    );
    const activeAssignmentsByMerchant = new Map(
      assignments.filter((a) => a.status === 'ACTIVE').map((a) => [a.merchantId, a])
    );
    const paymentTotalsByMerchant = payments.reduce((acc, p) => {
      acc.set(String(p.merchantId || ''), (acc.get(String(p.merchantId || '')) || 0) + Number(p.amount || 0));
      return acc;
    }, new Map());
    const paymentTotalsByBank = payments.reduce((acc, p) => {
      acc.set(String(p.bankId || ''), (acc.get(String(p.bankId || '')) || 0) + Number(p.amount || 0));
      return acc;
    }, new Map());

    const placesWithAssignments = places.map((place) => {
      const assignment = activeAssignmentsByPlace.get(place.id);
      if (!assignment) return place;
      return {
        ...place,
        rentPrice: assignment.rentAmount || place.rentPrice,
        status: 'OCCUPIED',
        currentMerchantId: assignment.merchantId,
        currentMerchantName: assignment.merchantName,
        currentAssignmentId: assignment.id,
      };
    });

    const merchantsWithTotals = merchants.map((merchant) => {
      const assignment = activeAssignmentsByMerchant.get(merchant.id);
      return {
        ...merchant,
        currentPlaceId: assignment?.placeId || merchant.currentPlaceId || null,
        currentPlaceCode: assignment?.placeCode || merchant.currentPlaceCode || '',
        totalPaid: paymentTotalsByMerchant.get(String(merchant.id)) || merchant.totalPaid || 0,
        balanceDue: balanceDueByMerchant.get(String(merchant.id)) || merchant.balanceDue || 0,
      };
    });

    const banksWithTotals = banks.map((bank) => ({
      ...bank,
      totalCollected: paymentTotalsByBank.get(String(bank.id)) || bank.totalCollected || 0,
      transactionCount: payments.filter((p) => String(p.bankId || '') === String(bank.id)).length || bank.transactionCount || 0,
    }));

    return {
      currentUser: options.currentUser || mapCurrentUser(currentUserResponse.user) || authStore.currentUser || null,
      market: mapMarket(settingsResponse.market, summaryResponse.summary, settingsResponse.settings || []),
      dashboardSummary: summaryResponse.summary || null,
      settings: settingsResponse.settings || [],
      users,
      roles,
      permissions: permissionsList,
      blocks: listData(responses.blocks || resourceFallbacks.blocks).map(mapBlock),
      places: placesWithAssignments,
      merchants: merchantsWithTotals,
      assignments,
      movements,
      obligations,
      banks: banksWithTotals,
      payments,
      receipts,
      auditLogs,
      bootstrapIssues: issues,
    };
  }

  async function hydrateFromApi(options = {}) {
    const token = getStoredToken();
    const tab = options.tab || uiStore.activeTab || getTabFromPath(window.location.pathname);
    const force = options.force ?? true;

    uiStore.setLoading(true);
    uiStore.setDataError('');

    if (!token) {
      authStore.authToken = '';
      authStore.setUser(null);
      authStore.ready = true;
      uiStore.setLoading(false);
      return null;
    }

    authStore.authToken = token;
    try {
      const payload = await loadBootstrapData({ tab, force, currentUser: options.currentUser });
      applyApiState(payload);
      const criticalIssues = (payload.bootstrapIssues || []).filter((i) => i.label);
      uiStore.setDataError(criticalIssues.length
        ? `Certaines données de la page n'ont pas pu être chargées: ${criticalIssues.map((i) => i.label).join(', ')}.`
        : '');
      lastLoadedPath = window.location.pathname;
      authStore.ready = true;
      persist();
      return payload;
    } catch (error) {
      uiStore.setDataError(error?.message || 'Impossible de charger les données.');
      throw error;
    } finally {
      uiStore.setLoading(false);
    }
  }

  async function init() {
    try {
      uiStore.setActiveTab(getTabFromPath(window.location.pathname));
      await hydrateFromApi({ force: true });
    } catch (error) {
      authStore.authError = error?.message || 'Impossible de charger la session.';
      setStoredToken('');
      authStore.authToken = '';
      authStore.setUser(null);
      authStore.ready = true;
    }
  }

  async function login(credentials) {
    authStore.authError = '';
    uiStore.setLoading(true);
    uiStore.setDataError('');
    try {
      const user = await authStore.login(credentials);
      const defaultTab = getDefaultTabForRole(user?.role);
      uiStore.setActiveTab(defaultTab);
      const payload = await loadBootstrapData({
        tab: defaultTab,
        force: true,
        currentUser: user,
      });
      applyApiState(payload);
      const criticalIssues = (payload.bootstrapIssues || []).filter((i) => i.label);
      uiStore.setDataError(criticalIssues.length
        ? `Certaines données de la page n'ont pas pu être chargées: ${criticalIssues.map((i) => i.label).join(', ')}.`
        : '');
      authStore.setUser(payload.currentUser || user);
      lastLoadedPath = getPathFromTab(defaultTab);
      authStore.ready = true;
      persist();
      return payload.currentUser || user;
    } catch (error) {
      setStoredToken('');
      authStore.authToken = '';
      authStore.setUser(null);
      uiStore.setDataError(error?.message || 'Connexion impossible.');
      throw error;
    } finally {
      uiStore.setLoading(false);
    }
  }

  async function logout() {
    await authStore.logout();
    structureStore.clear();
    merchantsStore.clear();
    financeStore.clear();
    adminStore.clear();
    uiStore.selectedReceipt = null;
    uiStore.isNewPaymentModalOpen = false;
    uiStore.isLoadingData = false;
    uiStore.dataError = '';
    Object.keys(responseCache).forEach((k) => { delete responseCache[k]; });
    authStore.ready = true;
  }

  // Actions déléguées (rétro-compatibilité)
  async function updateMarket(data) { await adminStore.updateMarket(data); await hydrateFromApi(); }
  async function addBlock(data) { await structureStore.addBlock(data); await hydrateFromApi(); }
  async function updateBlock(id, data) { await structureStore.updateBlock(id, data); await hydrateFromApi(); }
  async function addPlace(data) { await structureStore.addPlace(data); await hydrateFromApi(); }
  async function updatePlace(id, data) { await structureStore.updatePlace(id, data); await hydrateFromApi(); }
  async function addMerchant(data) { await merchantsStore.addMerchant(data); await hydrateFromApi(); }
  async function updateMerchant(id, data) { await merchantsStore.updateMerchant(id, data); await hydrateFromApi(); }
  async function deleteMerchant(id) { await merchantsStore.deleteMerchant(id); await hydrateFromApi(); }

  async function assignPlace(placeId, merchantId, startDate, rentAmount, notes = '') {
    const result = await merchantsStore.assignPlace(placeId, merchantId, startDate, rentAmount, notes);
    await hydrateFromApi();
    return result;
  }

  async function terminateAssignment(assignmentId, endDate, reason) {
    const result = await merchantsStore.terminateAssignment(assignmentId, endDate, reason);
    await hydrateFromApi();
    return result;
  }

  async function transferPlace(merchantId, fromPlaceId, toPlaceId, date, reason, rentAmount) {
    await merchantsStore.transferPlace(merchantId, fromPlaceId, toPlaceId, date, reason, rentAmount);
    return true;
  }

  async function addBank(data) { await financeStore.addBank(data); await hydrateFromApi(); }
  async function updateBank(id, data) { await financeStore.updateBank(id, data); await hydrateFromApi(); }
  async function deleteBank(id) { await financeStore.deleteBank(id); await hydrateFromApi(); }

  async function recordPayment(data) {
    const payment = await financeStore.recordPayment(data);
    uiStore.setSelectedReceipt(payment);
    uiStore.setIsNewPaymentModalOpen(false);
    await hydrateFromApi();
    uiStore.setSelectedReceipt(payment);
    return payment;
  }

  async function voidPayment(paymentId, reason) { await financeStore.voidPayment(paymentId, reason); await hydrateFromApi(); }
  async function cancelReceipt(receiptId, reason) { await financeStore.cancelReceipt(receiptId, reason); await hydrateFromApi(); }
  async function exportExcel(scope) { await financeStore.exportExcel(scope); }
  async function downloadTemplate(scope) { await financeStore.downloadTemplate(scope); }
  async function importExcel(file, scope) { const r = await financeStore.importExcel(file, scope); await hydrateFromApi(); return r; }

  async function addUser(data) { await adminStore.addUser(data); await hydrateFromApi(); }
  async function updateUser(userId, data) { await adminStore.updateUser(userId, data); await hydrateFromApi(); }
  async function deleteUser(userId) {
    if (authStore.currentUser?.id === userId) return false;
    await adminStore.deleteUser(userId);
    await hydrateFromApi();
    return true;
  }

  async function addRole(data) { await adminStore.addRole(data); await hydrateFromApi(); }
  async function updateRole(id, data) { await adminStore.updateRole(id, data); await hydrateFromApi(); }
  async function deleteRole(id) { await adminStore.deleteRole(id); await hydrateFromApi(); }
  async function addPermission(data) { await adminStore.addPermission(data); await hydrateFromApi(); }
  async function updatePermission(id, data) { await adminStore.updatePermission(id, data); await hydrateFromApi(); }
  async function deletePermission(id) { await adminStore.deletePermission(id); await hydrateFromApi(); }

  function setSelectedReceipt(payment) { uiStore.setSelectedReceipt(payment); }
  function setIsNewPaymentModalOpen(open) { uiStore.setIsNewPaymentModalOpen(open); }

  function setCurrentUser(userId) {
    const nextUser = adminStore.users.find((u) => u.id === userId);
    if (!nextUser) return null;
    authStore.setUser(nextUser);
    uiStore.setActiveTab(getDefaultTabForRole(nextUser.role));
    persist();
    return nextUser;
  }

  async function syncRoute(pathname) {
    const nextTab = getTabFromPath(pathname);
    uiStore.setActiveTab(nextTab);
    const role = authStore.currentUser?.role || 'SUPER_ADMIN';
    const permissions = authStore.currentUser?.permissions || [];
    if (!getRoutesForUser(role, permissions).some((route) => route.tab === nextTab)) {
      uiStore.setActiveTab(getDefaultTabForRole(role));
    }
    persist();
    if (pathname === lastLoadedPath) return;
    const forceReload = nextTab === 'admin-users';
    void hydrateFromApi({ tab: nextTab, force: forceReload }).catch(() => {});
  }

  function toggleSidebar() { uiStore.toggleSidebar(); persist(); }
  function toggleRoleMenu() { uiStore.toggleRoleMenu(); }
  function toggleNotifications() { uiStore.toggleNotifications(); }
  function changeRole() { uiStore.showRoleMenu = false; }

  async function resetToDefaults() { await hydrateFromApi(); window.location.assign('/'); }
  async function refreshFromBackend() { await hydrateFromApi(); }

  // Computed analytics (inchangés)
  const currentView = computed(() => uiStore.activeTab);
  const roleAbbr = computed(() =>
    authStore.currentUser?.role === 'SUPER_ADMIN' ? 'SA'
      : authStore.currentUser?.role === 'ADMIN' ? 'AD' : 'CP'
  );
  const pageTitle = computed(() => getRouteLabel(uiStore.activeTab));
  const pageSubtitle = computed(() => {
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(currentDate);
    return `${adminStore.market?.name || ''} • ${formattedDate}`;
  });
  const overdueCount = computed(() => financeStore.obligations.filter((o) => o.status === 'OVERDUE').length);

  const kpis = computed(() => {
    const occupiedPlaces = structureStore.places.filter((p) => p.status === 'OCCUPIED');
    const expectedMonthly = occupiedPlaces.reduce((s, p) => s + p.rentPrice, 0);
    const obtainedMonthly = financeStore.payments
      .filter((p) => p.periodYear === currentYear && p.periodMonth === currentMonth)
      .reduce((s, p) => s + p.amount, 0);
    const unpaidMonthly = Math.max(0, expectedMonthly - obtainedMonthly);
    const recoveryRateMonthly = expectedMonthly > 0 ? (obtainedMonthly / expectedMonthly) * 100 : 0;
    const totalPlaces = structureStore.places.length;
    const availablePlaces = structureStore.places.filter((p) => p.status === 'AVAILABLE').length;
    const maintenancePlaces = structureStore.places.filter((p) => p.status === 'MAINTENANCE').length;
    const occupancyRate = totalPlaces > 0 ? Math.round((occupiedPlaces.length / totalPlaces) * 100) : 0;
    const activeMerchants = merchantsStore.merchants.filter((m) => m.status === 'ACTIVE').length;
    const inactiveMerchants = merchantsStore.merchants.filter((m) => m.status === 'INACTIVE').length;

    return {
      expectedMonthly, obtainedMonthly, unpaidMonthly, recoveryRateMonthly,
      expectedAnnual: expectedMonthly * 12,
      obtainedAnnual: financeStore.payments
        .filter((p) => p.periodYear === currentYear)
        .reduce((s, p) => s + p.amount, 0),
      totalPlaces, occupiedPlaces: occupiedPlaces.length, availablePlaces, maintenancePlaces, occupancyRate,
      totalMerchants: merchantsStore.merchants.length, activeMerchants, inactiveMerchants,
    };
  });

  const monthlyTrends = computed(() =>
    monthNames.slice(0, currentMonth).map((month, index) => {
      const monthNumber = index + 1;
      const expected = financeStore.obligations
        .filter((o) => o.periodYear === currentYear && o.periodMonth === monthNumber)
        .reduce((s, o) => s + o.amountExpected, 0);
      const obtained = financeStore.payments
        .filter((p) => p.periodYear === currentYear && p.periodMonth === monthNumber)
        .reduce((s, p) => s + p.amount, 0);
      return { month, rate: expected > 0 ? Math.min(100, Math.round((obtained / expected) * 100)) : 0 };
    })
  );

  const blockStats = computed(() =>
    (structureStore.blocks || []).filter((b) => b && b.id).map((block) => {
      const blockPlaces = structureStore.places.filter((p) => p.blockId === block.id || p.blockCode === block.code);
      const occupied = blockPlaces.filter((p) => p.status === 'OCCUPIED').length;
      const expectedRevenue = blockPlaces.filter((p) => p.status === 'OCCUPIED').reduce((s, p) => s + p.rentPrice, 0);
      const obtainedRevenue = financeStore.payments
        .filter((p) => p.blockCode === block.code && p.periodYear === currentYear && p.periodMonth === currentMonth)
        .reduce((s, p) => s + p.amount, 0);
      return {
        ...block,
        totalPlaces: blockPlaces.length,
        occupiedPlaces: occupied,
        availablePlaces: blockPlaces.filter((p) => p.status === 'AVAILABLE').length,
        occupancyRate: blockPlaces.length > 0 ? Math.round((occupied / blockPlaces.length) * 100) : 0,
        expectedRevenue, obtainedRevenue,
      };
    })
  );

  const overdueMerchants = computed(() =>
    merchantsStore.merchants
      .map((merchant) => {
        const merchantObligations = financeStore.obligations.filter(
          (o) => o.merchantId === merchant.id && o.status !== 'PAID'
        );
        return {
          merchant,
          placeCode: merchant.currentPlaceCode || 'N/A',
          blockCode: structureStore.places.find((p) => p.id === merchant.currentPlaceId)?.blockCode || 'Bloc',
          unpaidMonths: merchantObligations.map((o) => o.periodLabel),
          totalOverdue: merchantObligations.reduce((s, o) => s + o.balance, 0),
        };
      })
      .filter((item) => item.totalOverdue > 0)
      .sort((a, b) => b.totalOverdue - a.totalOverdue)
  );

  const totalTransactions = computed(() => financeStore.banks.reduce((s, b) => s + b.transactionCount, 0));
  const totalBanked = computed(() => financeStore.banks.reduce((s, b) => s + b.totalCollected, 0));

  return {
    state,
    ready,
    searchQuery,
    showRoleMenu,
    showNotifications,
    currentView,
    roleAbbr,
    pageTitle,
    pageSubtitle,
    overdueCount,
    kpis,
    monthlyTrends,
    blockStats,
    overdueMerchants,
    totalTransactions,
    totalBanked,
    init,
    updateMarket,
    addBlock,
    updateBlock,
    addPlace,
    updatePlace,
    addMerchant,
    addUser,
    updateUser,
    deleteUser,
    updateMerchant,
    deleteMerchant,
    assignPlace,
    terminateAssignment,
    transferPlace,
    addBank,
    updateBank,
    deleteBank,
    recordPayment,
    addRole,
    updateRole,
    deleteRole,
    addPermission,
    updatePermission,
    deletePermission,
    setSelectedReceipt,
    setIsNewPaymentModalOpen,
    cancelReceipt,
    voidPayment,
    exportExcel,
    downloadTemplate,
    importExcel,
    syncRoute,
    toggleSidebar,
    toggleRoleMenu,
    toggleNotifications,
    changeRole,
    setCurrentUser,
    resetToDefaults,
    refreshFromBackend,
    login,
    logout,
    getPathFromTab,
  };
});

export const marketStore = useMarketStore();
