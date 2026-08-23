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
  state.blocks.map((block) => {
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
  syncRoute,
  toggleSidebar,
  toggleRoleMenu,
  toggleNotifications,
  changeRole,
  resetToDefaults,
  getPathFromTab,
};
