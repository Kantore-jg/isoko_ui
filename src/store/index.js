import { computed, reactive, ref } from 'vue';
import {
  getDefaultTabForRole,
  getMonthNames,
  getPathFromTab,
  getRouteLabel,
  getTabFromPath,
  getVisibleRoutes,
} from '../config/api.js';
import { downloadBlob, getStoredToken, setStoredToken } from '../services/apiClient.js';
import {
  createBankApi,
  createMerchantApi,
  createAssignmentApi,
  createBlockApi,
  createPermissionApi,
  createPaymentApi,
  createPlaceApi,
  createRoleApi,
  createUserApi,
  dashboardSummaryApi,
  deleteBankApi,
  deleteBlockApi,
  deleteMerchantApi,
  deletePlaceApi,
  deleteUserApi,
  deletePermissionApi,
  deleteRoleApi,
  listApi,
  listBanksApi,
  listMerchantsApi,
  listPermissionsApi,
  listPaymentsApi,
  listReceiptsApi,
  listRolesApi,
  listUsersApi,
  loginApi,
  logoutApi,
  meApi,
  importExcelApi,
  exportExcelApi,
  templateExcelApi,
  cancelReceiptApi,
  terminateAssignmentApi,
  settingsApi,
  updateSettingsApi,
  updateBankApi,
  updateBlockApi,
  updateMerchantApi,
  updatePlaceApi,
  updatePermissionApi,
  updateRoleApi,
  updateUserApi,
  voidPaymentApi,
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

const monthNames = getMonthNames();

const state = reactive({
  currentUser: null,
  activeTab: 'dashboard-super',
  sidebarCollapsed: false,
  market: null,
  dashboardSummary: null,
  settings: [],
  users: [],
  roles: [],
  permissions: [],
  blocks: [],
  places: [],
  merchants: [],
  assignments: [],
  movements: [],
  obligations: [],
  banks: [],
  payments: [],
  receipts: [],
  auditLogs: [],
  selectedReceipt: null,
  isNewPaymentModalOpen: false,
  isLoadingData: false,
  dataError: '',
  authError: '',
  authToken: '',
});

const ready = ref(false);
const searchQuery = ref('');
const showRoleMenu = ref(false);
const showNotifications = ref(false);
let lastLoadedPath = '';

const sharedResources = ['currentUser', 'market'];
const pageResourceMap = {
  'dashboard-super': ['dashboardSummary', 'blocks', 'places', 'merchants', 'assignments', 'movements', 'obligations', 'banks', 'payments', 'receipts'],
  'dashboard-admin': ['dashboardSummary', 'blocks', 'places', 'merchants', 'assignments', 'movements'],
  'dashboard-accountant': ['dashboardSummary', 'obligations', 'banks', 'payments', 'receipts'],
  'dashboard-occupancy': ['dashboardSummary', 'blocks', 'places', 'merchants', 'assignments', 'movements', 'obligations'],
  'structure-blocks': ['blocks', 'places'],
  'structure-places': ['blocks', 'places', 'merchants', 'assignments'],
  'merchants-list': ['merchants', 'places', 'assignments', 'payments'],
  'merchants-assignments': ['assignments', 'places', 'merchants'],
  'merchants-movements': ['movements', 'places', 'merchants'],
  'finances-rents': ['obligations', 'payments', 'receipts', 'banks', 'merchants', 'places', 'assignments'],
  'finances-payments': ['payments', 'banks', 'obligations', 'merchants', 'places'],
  'finances-banks': ['banks', 'payments'],
  'tools-excel': ['blocks', 'places', 'merchants', 'assignments', 'payments', 'obligations', 'banks', 'receipts'],
  'tools-audit': ['auditLogs'],
  'admin-users': ['users', 'roles', 'permissions'],
  'admin-settings': ['settings'],
};

const resourceLoaders = {
  currentUser: (options = {}) => (options.currentUser ? Promise.resolve({ user: options.currentUser }) : meApi()),
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

function snapshotState() {
  return {
    currentUser: state.currentUser,
    activeTab: state.activeTab,
    sidebarCollapsed: state.sidebarCollapsed,
    market: state.market,
    dashboardSummary: state.dashboardSummary,
    settings: state.settings,
    users: state.users,
    roles: state.roles,
    permissions: state.permissions,
    blocks: state.blocks,
    places: state.places,
    merchants: state.merchants,
    assignments: state.assignments,
    movements: state.movements,
    obligations: state.obligations,
    banks: state.banks,
    payments: state.payments,
    receipts: state.receipts,
    auditLogs: state.auditLogs,
    isLoadingData: state.isLoadingData,
  };
}

function createId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function getPageResources(tab) {
  return [...new Set([...(pageResourceMap[tab] || []), ...sharedResources])];
}

function clearPageResources(resources) {
  for (const resource of resources) {
    if (resource === 'currentUser') {
      continue;
    }

    if (resource === 'market') {
      state.market = null;
      state.settings = [];
      continue;
    }

    if (resource === 'dashboardSummary') {
      state.dashboardSummary = null;
      continue;
    }

    if (Array.isArray(state[resource])) {
      state[resource] = [];
    }
  }
}

function listData(response) {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.data || [];
}

function persist() {
  try {
    window.localStorage.setItem('market-management-ui-state', JSON.stringify(snapshotState()));
  } catch {
    //
  }
}

function applyApiState(payload) {
  if (Object.prototype.hasOwnProperty.call(payload, 'currentUser')) {
    state.currentUser = payload.currentUser;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'market')) {
    state.market = payload.market;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'dashboardSummary')) {
    state.dashboardSummary = payload.dashboardSummary || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'settings')) {
    state.settings = payload.settings || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'users')) {
    state.users = payload.users || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'roles')) {
    state.roles = payload.roles || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'permissions')) {
    state.permissions = payload.permissions || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'blocks')) {
    state.blocks = payload.blocks || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'places')) {
    state.places = payload.places || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'merchants')) {
    state.merchants = payload.merchants || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'assignments')) {
    state.assignments = payload.assignments || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'movements')) {
    state.movements = payload.movements || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'obligations')) {
    state.obligations = payload.obligations || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'banks')) {
    state.banks = payload.banks || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'payments')) {
    state.payments = payload.payments || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'receipts')) {
    state.receipts = payload.receipts || [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'auditLogs')) {
    state.auditLogs = payload.auditLogs || [];
  }

  state.activeTab = getTabFromPath(window.location.pathname);
  const role = state.currentUser?.role || 'SUPER_ADMIN';
  if (!getVisibleRoutes(role).some((route) => route.tab === state.activeTab)) {
    state.activeTab = getDefaultTabForRole(role);
  }
}

async function loadBootstrapData(options = {}) {
  const tab = options.tab || state.activeTab || getTabFromPath(window.location.pathname);
  const resources = getPageResources(tab);
  const issues = [];
  const responses = {};

  clearPageResources(resources.filter((resource) => resource !== 'currentUser' && resource !== 'market'));

  const safe = async (loader, fallback, label) => {
    try {
      return await loader();
    } catch (error) {
      issues.push({ label, message: error?.message || 'Erreur inconnue.' });
      return fallback;
    }
  };

  await Promise.all(resources.map(async (resource) => {
    const loader = resourceLoaders[resource];
    if (!loader) {
      return;
    }

    responses[resource] = await safe(
      resource === 'currentUser'
        ? () => loader(options)
        : loader,
      resourceFallbacks[resource],
      resource
    );
  }));

  const meResponse = responses.currentUser || resourceFallbacks.currentUser;
  const settingsResponse = responses.market || resourceFallbacks.market;
  const summaryResponse = responses.dashboardSummary || resourceFallbacks.dashboardSummary;
  const blocksResponse = responses.blocks || resourceFallbacks.blocks;
  const placesResponse = responses.places || resourceFallbacks.places;
  const merchantsResponse = responses.merchants || resourceFallbacks.merchants;
  const assignmentsResponse = responses.assignments || resourceFallbacks.assignments;
  const movementsResponse = responses.movements || resourceFallbacks.movements;
  const obligationsResponse = responses.obligations || resourceFallbacks.obligations;
  const banksResponse = responses.banks || resourceFallbacks.banks;
  const paymentsResponse = responses.payments || resourceFallbacks.payments;
  const receiptsResponse = responses.receipts || resourceFallbacks.receipts;
  const usersResponse = responses.users || resourceFallbacks.users;
  const rolesResponse = responses.roles || resourceFallbacks.roles;
  const permissionsResponse = responses.permissions || resourceFallbacks.permissions;
  const auditLogsResponse = responses.auditLogs || resourceFallbacks.auditLogs;

  const assignments = listData(assignmentsResponse).map(mapAssignment);
  const places = listData(placesResponse).map(mapPlace);
  const merchants = listData(merchantsResponse).map(mapMerchant);
  const payments = listData(paymentsResponse).map(mapPayment);
  const receipts = listData(receiptsResponse).map(mapReceipt);
  const banks = listData(banksResponse).map(mapBank);
  const obligations = listData(obligationsResponse).map(mapObligation);
  const movements = listData(movementsResponse).map(mapMovement);
  const users = listData(usersResponse).map(mapCurrentUser);
  const roles = listData(rolesResponse).map(mapRole);
  const permissions = listData(permissionsResponse).map(mapPermission);
  const auditLogs = listData(auditLogsResponse).map(mapAuditLog);
  const balanceDueByMerchant = obligations.reduce((accumulator, obligation) => {
    const key = String(obligation.merchantId || '');
    accumulator.set(key, (accumulator.get(key) || 0) + Number(obligation.balance || 0));
    return accumulator;
  }, new Map());

  const activeAssignmentsByPlace = new Map(
    assignments
      .filter((assignment) => assignment.status === 'ACTIVE')
      .map((assignment) => [assignment.placeId, assignment])
  );

  const activeAssignmentsByMerchant = new Map(
    assignments
      .filter((assignment) => assignment.status === 'ACTIVE')
      .map((assignment) => [assignment.merchantId, assignment])
  );

  const paymentTotalsByMerchant = payments.reduce((accumulator, payment) => {
    const key = String(payment.merchantId || '');
    accumulator.set(key, (accumulator.get(key) || 0) + Number(payment.amount || 0));
    return accumulator;
  }, new Map());

  const paymentTotalsByBank = payments.reduce((accumulator, payment) => {
    const key = String(payment.bankId || '');
    accumulator.set(key, (accumulator.get(key) || 0) + Number(payment.amount || 0));
    return accumulator;
  }, new Map());

  const placesWithAssignments = places.map((place) => {
    const assignment = activeAssignmentsByPlace.get(place.id);
    if (!assignment) {
      return place;
    }

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
    transactionCount: payments.filter((payment) => String(payment.bankId || '') === String(bank.id)).length || bank.transactionCount || 0,
  }));

  return {
    currentUser: options.currentUser || mapCurrentUser(meResponse.user),
    market: mapMarket(settingsResponse.market, summaryResponse.summary, settingsResponse.settings || []),
    dashboardSummary: summaryResponse.summary || null,
    settings: settingsResponse.settings || [],
    users,
    roles,
    permissions,
    blocks: listData(blocksResponse).map(mapBlock),
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

async function hydrateFromApi() {
  const token = getStoredToken();
  const tab = state.activeTab || getTabFromPath(window.location.pathname);

  state.isLoadingData = true;
  state.dataError = '';

  if (!token) {
    state.authToken = '';
    state.currentUser = null;
    ready.value = true;
    state.isLoadingData = false;
    return null;
  }

  state.authToken = token;
  try {
    const payload = await loadBootstrapData({ tab });
    applyApiState(payload);
    const criticalIssues = (payload.bootstrapIssues || []).filter((issue) => issue.label);
    state.dataError = criticalIssues.length
      ? `Certaines données de la page n'ont pas pu être chargées: ${criticalIssues.map((issue) => issue.label).join(', ')}.`
      : '';
    lastLoadedPath = window.location.pathname;
    ready.value = true;
    persist();
    return payload;
  } catch (error) {
    state.dataError = error?.message || 'Impossible de charger les données.';
    throw error;
  } finally {
    state.isLoadingData = false;
  }
}

async function init() {
  try {
    state.activeTab = getTabFromPath(window.location.pathname);
    await hydrateFromApi();
  } catch (error) {
    state.authError = error?.message || 'Impossible de charger la session.';
    setStoredToken('');
    state.authToken = '';
    state.currentUser = null;
    ready.value = true;
  }
}

async function login(credentials) {
  state.authError = '';
  state.isLoadingData = true;
  state.dataError = '';

  try {
    const response = await loginApi(credentials);
    setStoredToken(response.access_token);
    state.authToken = response.access_token;
    state.activeTab = getTabFromPath(window.location.pathname);
    const payload = await loadBootstrapData({
      tab: state.activeTab,
      currentUser: mapCurrentUser(response.user),
    });
    applyApiState(payload);
    const criticalIssues = (payload.bootstrapIssues || []).filter((issue) => issue.label);
    state.dataError = criticalIssues.length
      ? `Certaines données de la page n'ont pas pu être chargées: ${criticalIssues.map((issue) => issue.label).join(', ')}.`
      : '';
    state.currentUser = payload.currentUser;
    lastLoadedPath = window.location.pathname;
    ready.value = true;
    persist();
    return payload.currentUser;
  } catch (error) {
    state.dataError = error?.message || 'Connexion impossible.';
    throw error;
  } finally {
    state.isLoadingData = false;
  }
}

async function logout() {
  try {
    await logoutApi();
  } catch {
    //
  }

  setStoredToken('');
  state.authToken = '';
  state.currentUser = null;
  state.market = null;
  state.dashboardSummary = null;
  state.settings = [];
  state.users = [];
  state.roles = [];
  state.permissions = [];
  state.blocks = [];
  state.places = [];
  state.merchants = [];
  state.assignments = [];
  state.movements = [];
  state.obligations = [];
  state.banks = [];
  state.payments = [];
  state.receipts = [];
  state.auditLogs = [];
  state.selectedReceipt = null;
  state.isNewPaymentModalOpen = false;
  state.isLoadingData = false;
  state.dataError = '';
  ready.value = true;
}

async function updateMarket(data) {
  await updateSettingsApi({
    market: {
      name: data.name,
      address: data.address,
      commune: data.city,
      province: data.country,
      phone: data.phone,
      email: data.email,
    },
    settings: [
      {
        key: 'currency_code',
        value: data.currency,
        type: 'string',
        description: 'Devise principale du marché',
      },
      {
        key: 'receipt_prefix',
        value: data.receiptPrefix || 'REC',
        type: 'string',
        description: 'Préfixe utilisé pour générer les reçus',
      },
    ],
  });
  await hydrateFromApi();
}

async function addBlock(data) {
  await createBlockApi({
    code: data.code,
    name: data.name,
    description: data.description,
    default_rent_amount: data.defaultRentPrice,
    status: data.status || 'ACTIVE',
  });
  await hydrateFromApi();
}

async function updateBlock(id, data) {
  await updateBlockApi(id, {
    code: data.code,
    name: data.name,
    description: data.description,
    default_rent_amount: data.defaultRentPrice,
    status: data.status || 'ACTIVE',
  });
  await hydrateFromApi();
}

async function addPlace(data) {
  await createPlaceApi({
    block_id: data.blockId,
    code: data.code,
    name: data.name || null,
    description: data.notes || data.description || null,
    surface: data.surface,
    type: data.category || 'STANDARD',
    status: data.status || 'AVAILABLE',
  });
  await hydrateFromApi();
}

async function updatePlace(id, data) {
  await updatePlaceApi(id, {
    block_id: data.blockId,
    code: data.code,
    name: data.name || null,
    description: data.notes || data.description || null,
    surface: data.surface,
    type: data.category || 'STANDARD',
    status: data.status || 'AVAILABLE',
  });
  await hydrateFromApi();
}

function addAuditLog(action, actionLabel, details, targetId, amount, bank) {
  const now = new Date();
  const timestamp = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  state.auditLogs = [
    {
      id: createId('log'),
      timestamp,
      userName: state.currentUser?.name || 'Système',
      userRole: state.currentUser?.role || 'SUPER_ADMIN',
      action,
      actionLabel,
      details,
      targetId,
      amount,
      bank,
    },
    ...state.auditLogs,
  ];
}

function makeMerchantCode(name) {
  const base = String(name || 'MRC').trim().replace(/[^A-Z0-9]+/gi, '-').toUpperCase().slice(0, 12) || 'MRC';
  return `${base}-${Date.now().toString().slice(-6)}`;
}

function defaultTitleForRole(role) {
  if (role === 'SUPER_ADMIN') return 'Directeur Général';
  if (role === 'ADMIN') return 'Commissaire du Marché';
  if (role === 'ACCOUNTANT') return 'Chef Comptable';
  return 'Utilisateur';
}

function makeUsername(name, email) {
  const source = String(email || name || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return source || `user-${Date.now().toString().slice(-6)}`;
}

async function addUser(data) {
  const role = state.roles.find((item) => item.id === Number(data.roleId) || item.code === data.role || item.code === data.roleCode)
    || state.roles.find((item) => item.code === 'ADMIN')
    || state.roles[0];

  if (!role) {
    throw new Error('Aucun rôle disponible pour créer un utilisateur.');
  }

  await createUserApi({
    role_id: role.id,
    name: data.name?.trim(),
    username: data.username?.trim() || makeUsername(data.name, data.email),
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    password: data.password || 'password123',
    status: data.status || 'ACTIVE',
  });
  await hydrateFromApi();
}

async function updateUser(userId, data) {
  const role = state.roles.find((item) => item.id === Number(data.roleId) || item.code === data.role || item.code === data.roleCode);

  await updateUserApi(userId, {
    role_id: role?.id,
    name: data.name?.trim(),
    username: data.username?.trim(),
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    password: data.password || undefined,
    status: data.status || undefined,
  });
  await hydrateFromApi();
}

async function deleteUser(userId) {
  if (state.currentUser?.id === userId) return false;
  await deleteUserApi(userId);
  await hydrateFromApi();
  return true;
}

function setCurrentUser(userId) {
  const nextUser = state.users.find((user) => user.id === userId);
  if (!nextUser) return null;
  state.currentUser = nextUser;
  state.activeTab = getDefaultTabForRole(nextUser.role);
  persist();
  return nextUser;
}

async function addMerchant(data) {
  await createMerchantApi({
    merchant_code: makeMerchantCode(data.name),
    business_name: data.name,
    owner_name: data.ownerName || data.name,
    national_id: data.cni,
    phone: data.phone,
    business_type: data.activity || data.category || '',
    address: data.address || data.notes || '',
    status: data.status || 'ACTIVE',
    registration_date: data.registrationDate || new Date().toISOString().slice(0, 10),
    notes: data.notes || data.address || '',
  });
  await hydrateFromApi();
}

async function updateMerchant(id, data) {
  const merchant = state.merchants.find((item) => item.id === id);
  await updateMerchantApi(id, {
    merchant_code: merchant?.merchantCode || makeMerchantCode(data.name || merchant?.name),
    business_name: data.name ?? merchant?.name,
    owner_name: data.ownerName || data.name || merchant?.name,
    national_id: data.cni ?? merchant?.cni,
    phone: data.phone ?? merchant?.phone,
    business_type: data.activity || data.category || merchant?.category || '',
    address: data.address || data.notes || merchant?.address || '',
    status: data.status || merchant?.status || 'ACTIVE',
    registration_date: data.registrationDate || merchant?.registrationDate || new Date().toISOString().slice(0, 10),
    notes: data.notes || data.address || merchant?.notes || '',
  });
  await hydrateFromApi();
}

async function deleteMerchant(id) {
  await deleteMerchantApi(id);
  await hydrateFromApi();
}

async function assignPlace(placeId, merchantId, startDate, rentAmount, notes = '') {
  const targetPlace = state.places.find((place) => place.id === placeId);
  const targetMerchant = state.merchants.find((merchant) => merchant.id === merchantId);
  if (!targetPlace || !targetMerchant) return null;

  const response = await createAssignmentApi({
    place_id: placeId,
    merchant_id: merchantId,
    start_date: startDate,
    rent_amount: rentAmount,
    assignment_reason: notes || `Affectation de la place ${targetPlace.code}`,
    notes,
  });

  await hydrateFromApi();
  return response.data || null;
}

async function terminateAssignment(assignmentId, endDate, reason = 'Départ / Fin de contrat') {
  const response = await terminateAssignmentApi(assignmentId, {
    end_date: endDate,
    reason,
  });

  await hydrateFromApi();
  return response.data || null;
}

async function transferPlace(merchantId, fromPlaceId, toPlaceId, date, reason, rentAmount) {
  const oldAssignment = state.assignments.find(
    (assignment) => assignment.merchantId === merchantId && assignment.placeId === fromPlaceId && assignment.status === 'ACTIVE'
  );

  if (oldAssignment) {
    await terminateAssignment(oldAssignment.id, date, reason || 'Mutation de place');
  }

  await assignPlace(toPlaceId, merchantId, date, rentAmount, `Mutation depuis ${fromPlaceId}: ${reason}`);
  return true;
}

async function addBank(data) {
  await createBankApi({
    code: data.code,
    name: data.name,
    account_name: data.accountName || data.contactPerson || '',
    account_number: data.accountNumber,
    branch: data.branch,
    description: data.description || '',
    status: data.isActive === false ? 'INACTIVE' : 'ACTIVE',
  });
  await hydrateFromApi();
}

async function updateBank(id, data) {
  await updateBankApi(id, {
    code: data.code,
    name: data.name,
    account_name: data.accountName || data.contactPerson || '',
    account_number: data.accountNumber,
    branch: data.branch,
    description: data.description || '',
    status: data.isActive === false ? 'INACTIVE' : 'ACTIVE',
  });
  await hydrateFromApi();
}

async function deleteBank(id) {
  await deleteBankApi(id);
  await hydrateFromApi();
}

function setIsNewPaymentModalOpen(open) {
  state.isNewPaymentModalOpen = open;
}

function excelFileName(kind, scope) {
  const date = new Date().toISOString().slice(0, 10);
  return `market-${kind}-${scope}-${date}.xlsx`;
}

async function exportExcel(scope = 'all') {
  const blob = await exportExcelApi(scope);
  downloadBlob(blob, excelFileName('export', scope));
}

async function downloadTemplate(scope = 'all') {
  const blob = await templateExcelApi(scope);
  downloadBlob(blob, excelFileName('template', scope));
}

async function importExcel(file, scope = 'all') {
  const response = await importExcelApi(file, scope);
  await hydrateFromApi();
  return response;
}

async function recordPayment(data) {
  const response = await createPaymentApi({
    merchant_id: data.merchantId,
    payment_date: data.paymentDate,
    amount: data.amount,
    bank_id: data.bankId,
    reference_number: data.referenceNumber,
    payment_method: data.paymentMethod || 'CASH',
    notes: data.notes || '',
    auto_allocate: data.autoAllocate ?? true,
    as_of_date: data.asOfDate || data.paymentDate,
    allocations: data.allocations?.length
      ? data.allocations
      : undefined,
  });

  const payment = mapPayment(response.data || {});
  state.selectedReceipt = payment;
  state.isNewPaymentModalOpen = false;
  await hydrateFromApi();
  state.selectedReceipt = payment;
  return payment;
}

async function addRole(data) {
  await createRoleApi({
    code: data.code,
    name: data.name,
    description: data.description || '',
    permission_ids: data.permissionIds || [],
  });
  await hydrateFromApi();
}

async function updateRole(id, data) {
  await updateRoleApi(id, {
    code: data.code,
    name: data.name,
    description: data.description || '',
    permission_ids: data.permissionIds || [],
  });
  await hydrateFromApi();
}

async function deleteRole(id) {
  await deleteRoleApi(id);
  await hydrateFromApi();
}

async function addPermission(data) {
  await createPermissionApi({
    code: data.code,
    name: data.name,
    module: data.module,
    description: data.description || '',
  });
  await hydrateFromApi();
}

async function updatePermission(id, data) {
  await updatePermissionApi(id, {
    code: data.code,
    name: data.name,
    module: data.module,
    description: data.description || '',
  });
  await hydrateFromApi();
}

async function deletePermission(id) {
  await deletePermissionApi(id);
  await hydrateFromApi();
}

function setSelectedReceipt(payment) {
  state.selectedReceipt = payment;
}

async function cancelReceipt(receiptId, reason = '') {
  await cancelReceiptApi(receiptId, { reason });
  await hydrateFromApi();
}

async function voidPayment(paymentId, reason) {
  await voidPaymentApi(paymentId, { void_reason: reason });
  await hydrateFromApi();
}

async function syncRoute(pathname) {
  const nextTab = getTabFromPath(pathname);
  state.activeTab = nextTab;
  const role = state.currentUser?.role || 'SUPER_ADMIN';
  if (!getVisibleRoutes(role).some((route) => route.tab === nextTab)) {
    state.activeTab = getDefaultTabForRole(role);
  }
  persist();

  if (pathname === lastLoadedPath) {
    return;
  }

  void hydrateFromApi().catch(() => {});
}

function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  persist();
}

function toggleRoleMenu() {
  showRoleMenu.value = !showRoleMenu.value;
  showNotifications.value = false;
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value;
  showRoleMenu.value = false;
}

function changeRole(role) {
  showRoleMenu.value = false;
}

async function resetToDefaults() {
  await hydrateFromApi();
  window.location.assign('/');
}

async function refreshFromBackend() {
  await hydrateFromApi();
}

const currentView = computed(() => state.activeTab);
const roleAbbr = computed(() =>
  state.currentUser?.role === 'SUPER_ADMIN'
    ? 'SA'
    : state.currentUser?.role === 'ADMIN'
      ? 'AD'
      : 'CP'
);
const pageTitle = computed(() => getRouteLabel(state.activeTab));
const pageSubtitle = computed(() => `${state.market?.name || ''} • Dimanche 23 Août 2026`);
const overdueCount = computed(() => state.obligations.filter((obligation) => obligation.status === 'OVERDUE').length);

const kpis = computed(() => {
  const occupiedPlaces = state.places.filter((place) => place.status === 'OCCUPIED');
  const expectedMonthly = occupiedPlaces.reduce((sum, place) => sum + place.rentPrice, 0);
  const obtainedMonthly = state.payments
    .filter((payment) => payment.periodYear === 2026 && payment.periodMonth === 8)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const unpaidMonthly = Math.max(0, expectedMonthly - obtainedMonthly);
  const recoveryRateMonthly = expectedMonthly > 0 ? (obtainedMonthly / expectedMonthly) * 100 : 0;
  const totalPlaces = state.places.length;
  const availablePlaces = state.places.filter((place) => place.status === 'AVAILABLE').length;
  const maintenancePlaces = state.places.filter((place) => place.status === 'MAINTENANCE').length;
  const occupancyRate = totalPlaces > 0 ? Math.round((occupiedPlaces.length / totalPlaces) * 100) : 0;
  const activeMerchants = state.merchants.filter((merchant) => merchant.status === 'ACTIVE').length;
  const inactiveMerchants = state.merchants.filter((merchant) => merchant.status === 'INACTIVE').length;

  return {
    expectedMonthly,
    obtainedMonthly,
    unpaidMonthly,
    recoveryRateMonthly,
    expectedAnnual: expectedMonthly * 12,
    obtainedAnnual: state.payments
      .filter((payment) => payment.periodYear === 2026)
      .reduce((sum, payment) => sum + payment.amount, 0),
    totalPlaces,
    occupiedPlaces: occupiedPlaces.length,
    availablePlaces,
    maintenancePlaces,
    occupancyRate,
    totalMerchants: state.merchants.length,
    activeMerchants,
    inactiveMerchants,
  };
});

const monthlyTrends = computed(() =>
  monthNames.slice(0, 8).map((month, index) => {
    const monthNumber = index + 1;
    const expected = state.obligations
      .filter((obligation) => obligation.periodYear === 2026 && obligation.periodMonth === monthNumber)
      .reduce((sum, obligation) => sum + obligation.amountExpected, 0);
    const obtained = state.payments
      .filter((payment) => payment.periodYear === 2026 && payment.periodMonth === monthNumber)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      month,
      rate: expected > 0 ? Math.min(100, Math.round((obtained / expected) * 100)) : 0,
    };
  })
);

const blockStats = computed(() =>
  (state.blocks || [])
    .filter((block) => block && block.id)
    .map((block) => {
    const blockPlaces = state.places.filter((place) => place.blockId === block.id || place.blockCode === block.code);
    const occupied = blockPlaces.filter((place) => place.status === 'OCCUPIED').length;
    const expectedRevenue = blockPlaces
      .filter((place) => place.status === 'OCCUPIED')
      .reduce((sum, place) => sum + place.rentPrice, 0);
    const obtainedRevenue = state.payments
      .filter((payment) => payment.blockCode === block.code && payment.periodYear === 2026 && payment.periodMonth === 8)
      .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        ...block,
        totalPlaces: blockPlaces.length,
        occupiedPlaces: occupied,
        availablePlaces: blockPlaces.filter((place) => place.status === 'AVAILABLE').length,
        occupancyRate: blockPlaces.length > 0 ? Math.round((occupied / blockPlaces.length) * 100) : 0,
        expectedRevenue,
        obtainedRevenue,
      };
    })
);

const overdueMerchants = computed(() =>
  state.merchants
    .map((merchant) => {
      const merchantObligations = state.obligations.filter(
        (obligation) => obligation.merchantId === merchant.id && obligation.status !== 'PAID'
      );
      return {
        merchant,
        placeCode: merchant.currentPlaceCode || 'N/A',
        blockCode: state.places.find((place) => place.id === merchant.currentPlaceId)?.blockCode || 'Bloc',
        unpaidMonths: merchantObligations.map((obligation) => obligation.periodLabel),
        totalOverdue: merchantObligations.reduce((sum, obligation) => sum + obligation.balance, 0),
      };
    })
    .filter((item) => item.totalOverdue > 0)
    .sort((a, b) => b.totalOverdue - a.totalOverdue)
);

const totalTransactions = computed(() => state.banks.reduce((sum, bank) => sum + bank.transactionCount, 0));
const totalBanked = computed(() => state.banks.reduce((sum, bank) => sum + bank.totalCollected, 0));

export const marketStore = {
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
