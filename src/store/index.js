import { computed, reactive, ref } from 'vue';
import {
  getDefaultTabForRole,
  getMonthNames,
  getPathFromTab,
  getRouteLabel,
  getTabFromPath,
  getVisibleRoutes,
} from '../config/api.js';
import { loadMarketState, resetMarketState, saveMarketState } from '../services/marketService.js';

const monthNames = getMonthNames();

const state = reactive({
  currentUser: null,
  activeTab: 'dashboard-super',
  sidebarCollapsed: false,
  market: null,
  users: [],
  blocks: [],
  places: [],
  merchants: [],
  assignments: [],
  movements: [],
  obligations: [],
  banks: [],
  payments: [],
  auditLogs: [],
  selectedReceipt: null,
  isNewPaymentModalOpen: false,
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
    users: state.users,
    blocks: state.blocks,
    places: state.places,
    merchants: state.merchants,
    assignments: state.assignments,
    movements: state.movements,
    obligations: state.obligations,
    banks: state.banks,
    payments: state.payments,
    auditLogs: state.auditLogs,
  };
}

function createId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function persist() {
  saveMarketState(snapshotState()).catch(() => {});
}

function applySeed(payload) {
  Object.assign(state, payload);
  state.activeTab = getTabFromPath(window.location.pathname);
  const role = state.currentUser?.role || 'SUPER_ADMIN';
  if (!getVisibleRoutes(role).some((route) => route.tab === state.activeTab)) {
    state.activeTab = getDefaultTabForRole(role);
  }
}

async function init() {
  applySeed(await loadMarketState());
  ready.value = true;
  await persist();
}

function updateMarket(data) {
  state.market = { ...state.market, ...data };
  persist();
}

function addBlock(data) {
  state.blocks = [...state.blocks, { ...data, id: createId('blk') }];
  state.market.totalBlocks += 1;
  persist();
}

function updateBlock(id, data) {
  state.blocks = state.blocks.map((block) => (block.id === id ? { ...block, ...data } : block));
  persist();
}

function addPlace(data) {
  state.places = [...state.places, { ...data, id: createId('plc') }];
  state.market.totalPlaces += 1;
  state.blocks = state.blocks.map((block) =>
    block.id === data.blockId ? { ...block, totalPlaces: block.totalPlaces + 1 } : block
  );
  persist();
}

function updatePlace(id, data) {
  state.places = state.places.map((place) => (place.id === id ? { ...place, ...data } : place));
  persist();
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

function addMerchant(data) {
  state.merchants = [
    ...state.merchants,
    { ...data, id: createId('mer'), totalPaid: 0, balanceDue: 0 },
  ];
  persist();
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

function setCurrentUser(userId) {
  const nextUser = state.users.find((user) => user.id === userId);
  if (!nextUser) return null;
  state.currentUser = nextUser;
  state.activeTab = getDefaultTabForRole(nextUser.role);
  persist();
  return nextUser;
}

function updateMerchant(id, data) {
  state.merchants = state.merchants.map((merchant) => (merchant.id === id ? { ...merchant, ...data } : merchant));
  persist();
}

function assignPlace(placeId, merchantId, startDate, rentAmount, notes = '') {
  const targetPlace = state.places.find((place) => place.id === placeId);
  const targetMerchant = state.merchants.find((merchant) => merchant.id === merchantId);
  if (!targetPlace || !targetMerchant) return null;

  const assignmentId = createId('asg');
  const now = new Date();
  const createdAt = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

  const newAssignment = {
    id: assignmentId,
    placeId,
    placeCode: targetPlace.code,
    blockCode: targetPlace.blockCode,
    merchantId,
    merchantName: targetMerchant.name,
    startDate,
    rentAmount,
    status: 'ACTIVE',
    createdBy: state.currentUser?.name || 'Système',
    createdAt,
    notes,
  };

  state.assignments = [newAssignment, ...state.assignments];
  state.places = state.places.map((place) =>
    place.id === placeId
      ? {
          ...place,
          status: 'OCCUPIED',
          currentMerchantId: merchantId,
          currentMerchantName: targetMerchant.name,
          currentAssignmentId: assignmentId,
          rentPrice: rentAmount,
          notes: place.notes,
        }
      : place
  );
  state.merchants = state.merchants.map((merchant) =>
    merchant.id === merchantId
      ? {
          ...merchant,
          status: 'ACTIVE',
          currentPlaceId: placeId,
          currentPlaceCode: targetPlace.code,
        }
      : merchant
  );

  state.movements = [
    {
      id: createId('mov'),
      placeId,
      placeCode: targetPlace.code,
      date: startDate,
      type: 'ENTRY',
      typeLabel: 'Entrée initiale',
      newMerchantId: merchantId,
      newMerchantName: targetMerchant.name,
      reason: notes || `Affectation de la place ${targetPlace.code}`,
      executedBy: state.currentUser?.name || 'Système',
      createdAt,
    },
    ...state.movements,
  ];

  state.obligations = [
    ...state.obligations,
    {
      id: createId('obl'),
      assignmentId,
      placeId,
      placeCode: targetPlace.code,
      blockCode: targetPlace.blockCode,
      merchantId,
      merchantName: targetMerchant.name,
      periodYear: 2026,
      periodMonth: 8,
      periodLabel: 'Août 2026',
      amountExpected: rentAmount,
      amountPaid: 0,
      balance: rentAmount,
      status: 'PENDING',
      dueDate: '2026-08-10',
    },
  ];

  addAuditLog('ASSIGNMENT_CREATED', 'Affectation Place', `Place ${targetPlace.code} affectée à ${targetMerchant.name}.`, targetPlace.code);
  persist();
  return newAssignment;
}

function terminateAssignment(assignmentId, endDate, reason = 'Départ / Fin de contrat') {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (!assignment) return null;

  state.assignments = state.assignments.map((item) =>
    item.id === assignmentId ? { ...item, status: 'ENDED', endDate } : item
  );
  state.places = state.places.map((place) =>
    place.id === assignment.placeId
      ? {
          ...place,
          status: 'AVAILABLE',
          currentMerchantId: undefined,
          currentMerchantName: undefined,
          currentAssignmentId: undefined,
        }
      : place
  );
  state.merchants = state.merchants.map((merchant) =>
    merchant.id === assignment.merchantId
      ? {
          ...merchant,
          currentPlaceId: undefined,
          currentPlaceCode: undefined,
        }
      : merchant
  );
  state.movements = [
    {
      id: createId('mov'),
      placeId: assignment.placeId,
      placeCode: assignment.placeCode,
      date: endDate,
      type: 'EXIT',
      typeLabel: 'Sortie / Libération',
      oldMerchantId: assignment.merchantId,
      oldMerchantName: assignment.merchantName,
      reason,
      executedBy: state.currentUser?.name || 'Système',
      createdAt: `${endDate} 00:00`,
    },
    ...state.movements,
  ];
  addAuditLog('ASSIGNMENT_ENDED', 'Libération Place', `Place ${assignment.placeCode} libérée.`, assignment.placeCode);
  persist();
  return assignment;
}

function transferPlace(merchantId, fromPlaceId, toPlaceId, date, reason, rentAmount) {
  const fromPlace = state.places.find((place) => place.id === fromPlaceId);
  const toPlace = state.places.find((place) => place.id === toPlaceId);
  const merchant = state.merchants.find((item) => item.id === merchantId);
  if (!fromPlace || !toPlace || !merchant) return null;

  const oldAssignment = state.assignments.find(
    (assignment) => assignment.merchantId === merchantId && assignment.placeId === fromPlaceId && assignment.status === 'ACTIVE'
  );

  if (oldAssignment) {
    state.assignments = state.assignments.map((assignment) =>
      assignment.id === oldAssignment.id ? { ...assignment, status: 'ENDED', endDate: date } : assignment
    );
  }

  state.places = state.places.map((place) =>
    place.id === fromPlaceId
      ? {
          ...place,
          status: 'AVAILABLE',
          currentMerchantId: undefined,
          currentMerchantName: undefined,
          currentAssignmentId: undefined,
        }
      : place
  );

  assignPlace(toPlaceId, merchantId, date, rentAmount, `Mutation depuis ${fromPlace.code}: ${reason}`);
  state.movements = [
    {
      id: createId('mov'),
      placeId: toPlaceId,
      placeCode: toPlace.code,
      date,
      type: 'TRANSFER',
      typeLabel: 'Mutation / Changement de Place',
      newMerchantId: merchantId,
      newMerchantName: merchant.name,
      reason: `Transfert depuis ${fromPlace.code}. Raison: ${reason}`,
      executedBy: state.currentUser?.name || 'Système',
      createdAt: `${date} 00:00`,
    },
    ...state.movements,
  ];
  addAuditLog('MOVEMENT_LOGGED', 'Mutation Commerçant', `Mutation de ${merchant.name} de ${fromPlace.code} vers ${toPlace.code}.`, toPlace.code);
  persist();
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

function setSelectedReceipt(payment) {
  state.selectedReceipt = payment;
}

function setIsNewPaymentModalOpen(open) {
  state.isNewPaymentModalOpen = open;
}

function recordPayment(data) {
  const merchant = state.merchants.find((item) => item.id === data.merchantId);
  const place = state.places.find((item) => item.id === data.placeId);
  const bank = state.banks.find((item) => item.id === data.bankId);
  const periodLabel = `${monthNames[data.periodMonth - 1] || 'Mois'} ${data.periodYear}`;
  const now = new Date();
  const createdAt = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

  const payment = {
    id: createId('pay'),
    receiptNumber: data.referenceNumber,
    referenceNumber: data.referenceNumber,
    merchantId: data.merchantId,
    merchantName: merchant?.name || 'Commerçant',
    placeId: data.placeId,
    placeCode: place?.code || 'Place',
    blockCode: place?.blockCode || 'Bloc',
    periodYear: data.periodYear,
    periodMonth: data.periodMonth,
    periodLabel,
    amount: data.amount,
    bankId: data.bankId,
    bankName: bank?.name || 'Banque',
    bankCode: bank?.code || 'BANQUE',
    paymentDate: data.paymentDate,
    recordedBy: state.currentUser?.name || 'Système',
    recordedByRole: state.currentUser?.role || 'SUPER_ADMIN',
    notes: data.notes,
    createdAt,
  };

  state.payments = [payment, ...state.payments];
  state.banks = state.banks.map((item) =>
    item.id === data.bankId
      ? {
          ...item,
          totalCollected: item.totalCollected + data.amount,
          transactionCount: item.transactionCount + 1,
        }
      : item
  );
  state.merchants = state.merchants.map((item) =>
    item.id === data.merchantId
      ? {
          ...item,
          totalPaid: (item.totalPaid || 0) + data.amount,
          balanceDue: Math.max(0, (item.balanceDue || 0) - data.amount),
        }
      : item
  );

  const currentObligation = state.obligations.find(
    (item) =>
      item.merchantId === data.merchantId &&
      item.placeId === data.placeId &&
      item.periodYear === data.periodYear &&
      item.periodMonth === data.periodMonth
  );

  if (currentObligation) {
    state.obligations = state.obligations.map((item) => {
      if (item.id !== currentObligation.id) return item;
      const amountPaid = item.amountPaid + data.amount;
      const balance = Math.max(0, item.amountExpected - amountPaid);
      return {
        ...item,
        amountPaid,
        balance,
        status: balance === 0 ? 'PAID' : 'PARTIAL',
        paidAt: data.paymentDate,
      };
    });
  }

  state.auditLogs = [
    {
      id: createId('log'),
      timestamp: createdAt,
      userName: state.currentUser?.name || 'Système',
      userRole: state.currentUser?.role || 'SUPER_ADMIN',
      action: 'PAYMENT_CREATED',
      actionLabel: 'Paiement & Reçu Enregistré',
      targetId: payment.referenceNumber,
      details: `Reçu ${payment.referenceNumber} (${payment.amount.toLocaleString()} FBu) encaissé pour ${payment.merchantName}.`,
      amount: payment.amount,
      bank: payment.bankCode,
    },
    ...state.auditLogs,
  ];

  state.selectedReceipt = payment;
  state.isNewPaymentModalOpen = false;
  persist();
  return payment;
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
  const nextUser = state.users.find((user) => user.role === role);
  if (!nextUser) return;
  state.currentUser = nextUser;
  state.activeTab = getDefaultTabForRole(role);
  showRoleMenu.value = false;
  persist();
}

async function resetToDefaults() {
  applySeed(await resetMarketState());
  ready.value = true;
  await persist();
  window.location.assign('/');
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
  updateMerchant,
  assignPlace,
  terminateAssignment,
  transferPlace,
  addBank,
  updateBank,
  recordPayment,
  setSelectedReceipt,
  setIsNewPaymentModalOpen,
  syncRoute,
  toggleSidebar,
  toggleRoleMenu,
  toggleNotifications,
  changeRole,
  setCurrentUser,
  resetToDefaults,
  getPathFromTab,
};
