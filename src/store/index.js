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
  createMerchantApi,
  createAssignmentApi,
  createBlockApi,
  createPaymentApi,
  createPlaceApi,
  dashboardSummaryApi,
  deleteBlockApi,
  deleteMerchantApi,
  deletePlaceApi,
  listApi,
  listMerchantsApi,
  listPaymentsApi,
  listReceiptsApi,
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
  updateBlockApi,
  updateMerchantApi,
  updatePlaceApi,
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
  mapReceipt,
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
  authError: '',
  authToken: '',
});

const ready = ref(false);
const searchQuery = ref('');
const showRoleMenu = ref(false);
const showNotifications = ref(false);

function snapshotState() {
  return {
    currentUser: state.currentUser,
    activeTab: state.activeTab,
    sidebarCollapsed: state.sidebarCollapsed,
    market: state.market,
    dashboardSummary: state.dashboardSummary,
    settings: state.settings,
    users: state.users,
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
  };
}

function createId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function persist() {
  try {
    window.localStorage.setItem('market-management-ui-state', JSON.stringify(snapshotState()));
  } catch {
    //
  }
}

function applyApiState(payload) {
  state.currentUser = payload.currentUser;
  state.market = payload.market;
  state.dashboardSummary = payload.dashboardSummary || null;
  state.settings = payload.settings || [];
  state.users = payload.users || [];
  state.blocks = payload.blocks || [];
  state.places = payload.places || [];
  state.merchants = payload.merchants || [];
  state.assignments = payload.assignments || [];
  state.movements = payload.movements || [];
  state.obligations = payload.obligations || [];
  state.banks = payload.banks || [];
  state.payments = payload.payments || [];
  state.receipts = payload.receipts || [];
  state.auditLogs = payload.auditLogs || [];
  state.activeTab = getTabFromPath(window.location.pathname);
  const role = state.currentUser?.role || 'SUPER_ADMIN';
  if (!getVisibleRoutes(role).some((route) => route.tab === state.activeTab)) {
    state.activeTab = getDefaultTabForRole(role);
  }
}

async function loadBootstrapData(options = {}) {
  const safe = async (loader, fallback) => {
    try {
      return await loader();
    } catch {
      return fallback;
    }
  };

  const [
    meResponse,
    settingsResponse,
    summaryResponse,
    blocksResponse,
    placesResponse,
    merchantsResponse,
    assignmentsResponse,
    movementsResponse,
    obligationsResponse,
    banksResponse,
    paymentsResponse,
    receiptsResponse,
    usersResponse,
    auditLogsResponse,
  ] = await Promise.all([
    options.currentUser ? Promise.resolve({ user: options.currentUser }) : meApi(),
    safe(settingsApi, { market: null, settings: [] }),
    safe(dashboardSummaryApi, { summary: {} }),
    safe(() => listApi('blocks', { per_page: 1000 }), { data: [] }),
    safe(() => listApi('places', { per_page: 1000 }), { data: [] }),
    safe(() => listMerchantsApi({ per_page: 1000 }), { data: [] }),
    safe(() => listApi('assignments', { per_page: 1000 }), { data: [] }),
    safe(() => listApi('movements', { per_page: 1000 }), { data: [] }),
    safe(() => listApi('rent-obligations', { per_page: 1000 }), { data: [] }),
    safe(() => listApi('banks', { per_page: 1000 }), { data: [] }),
    safe(() => listPaymentsApi({ per_page: 1000 }), { data: [] }),
    safe(() => listReceiptsApi({ per_page: 1000 }), { data: [] }),
    safe(() => listApi('users', { per_page: 1000 }), { data: [] }),
    safe(() => listApi('audit-logs', { per_page: 1000 }), { data: [] }),
  ]);

  const assignments = (assignmentsResponse.data || []).map(mapAssignment);
  const places = (placesResponse.data || []).map(mapPlace);
  const merchants = (merchantsResponse.data || []).map(mapMerchant);
  const payments = (paymentsResponse.data || []).map(mapPayment);
  const receipts = (receiptsResponse.data || []).map(mapReceipt);
  const banks = (banksResponse.data || []).map(mapBank);
  const obligations = (obligationsResponse.data || []).map(mapObligation);
  const movements = (movementsResponse.data || []).map(mapMovement);
  const users = (usersResponse.data || []).map(mapCurrentUser);
  const auditLogs = (auditLogsResponse.data || []).map(mapAuditLog);
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
    blocks: (blocksResponse.data || []).map(mapBlock),
    places: placesWithAssignments,
    merchants: merchantsWithTotals,
    assignments,
    movements,
    obligations,
    banks: banksWithTotals,
    payments,
    receipts,
    auditLogs,
  };
}

async function hydrateFromApi() {
  const token = getStoredToken();

  if (!token) {
    state.authToken = '';
    state.currentUser = null;
    ready.value = true;
    return null;
  }

  state.authToken = token;
  const payload = await loadBootstrapData();
  applyApiState(payload);
  ready.value = true;
  persist();
  return payload;
}

async function init() {
  try {
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
  const response = await loginApi(credentials);
  setStoredToken(response.access_token);
  state.authToken = response.access_token;
  const payload = await loadBootstrapData({
    currentUser: mapCurrentUser(response.user),
  });
  applyApiState(payload);
  state.currentUser = payload.currentUser;
  ready.value = true;
  persist();
  return payload.currentUser;
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

function addUser(data) {
  const role = data.role || 'ADMIN';
  const user = {
    id: createId('usr'),
    name: data.name?.trim() || 'Nouvel utilisateur',
    email: data.email?.trim() || '',
    phone: data.phone?.trim() || '',
    role,
    title: data.title?.trim() || defaultTitleForRole(role),
  };

  state.users = [user, ...state.users];
  persist();
  return user;
}

function updateUser(userId, data) {
  const nextUsers = state.users.map((user) =>
    user.id === userId
      ? {
          ...user,
          name: data.name?.trim() || user.name,
          email: data.email?.trim() || user.email,
          phone: data.phone?.trim() || user.phone,
          role: data.role || user.role,
          title: data.title?.trim() || user.title,
        }
      : user
  );

  state.users = nextUsers;
  if (state.currentUser?.id === userId) {
    state.currentUser = nextUsers.find((user) => user.id === userId) || state.currentUser;
  }
  persist();
  return state.users.find((user) => user.id === userId) || null;
}

function deleteUser(userId) {
  if (state.currentUser?.id === userId) return false;
  state.users = state.users.filter((user) => user.id !== userId);
  persist();
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

function addBank(data) {
  state.banks = [
    ...state.banks,
    { ...data, id: createId('bank'), totalCollected: 0, transactionCount: 0 },
  ];
  persist();
}

function updateBank(id, data) {
  state.banks = state.banks.map((bank) => (bank.id === id ? { ...bank, ...data } : bank));
  persist();
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

function syncRoute(pathname) {
  const nextTab = getTabFromPath(pathname);
  state.activeTab = nextTab;
  const role = state.currentUser?.role || 'SUPER_ADMIN';
  if (!getVisibleRoutes(role).some((route) => route.tab === nextTab)) {
    state.activeTab = getDefaultTabForRole(role);
  }
  persist();
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
  recordPayment,
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
