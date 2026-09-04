import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { getRouteLabel, getTabFromPath } from '../config/api.js';

export const useUiStore = defineStore('ui', () => {
  const activeTab = ref('dashboard-super');
  const sidebarCollapsed = ref(false);
  const searchQuery = ref('');
  const showRoleMenu = ref(false);
  const showNotifications = ref(false);
  const selectedReceipt = ref(null);
  const isNewPaymentModalOpen = ref(false);
  const isLoadingData = ref(false);
  const dataError = ref('');

  const currentView = computed(() => activeTab.value);
  const pageTitle = computed(() => getRouteLabel(activeTab.value));

  function setActiveTab(tab) {
    activeTab.value = tab;
  }

  function setActiveTabFromPath(pathname) {
    activeTab.value = getTabFromPath(pathname);
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function toggleRoleMenu() {
    showRoleMenu.value = !showRoleMenu.value;
    showNotifications.value = false;
  }

  function toggleNotifications() {
    showNotifications.value = !showNotifications.value;
    showRoleMenu.value = false;
  }

  function setSelectedReceipt(receipt) {
    selectedReceipt.value = receipt;
  }

  function setIsNewPaymentModalOpen(open) {
    isNewPaymentModalOpen.value = open;
  }

  function setLoading(loading) {
    isLoadingData.value = loading;
  }

  function setDataError(error) {
    dataError.value = error;
  }

  return {
    activeTab,
    sidebarCollapsed,
    searchQuery,
    showRoleMenu,
    showNotifications,
    selectedReceipt,
    isNewPaymentModalOpen,
    isLoadingData,
    dataError,
    currentView,
    pageTitle,
    setActiveTab,
    setActiveTabFromPath,
    toggleSidebar,
    toggleRoleMenu,
    toggleNotifications,
    setSelectedReceipt,
    setIsNewPaymentModalOpen,
    setLoading,
    setDataError,
  };
});
