import { ref, computed, watch } from 'vue';
import { listApi } from '../services/marketApi.js';

/**
 * Composable pour la pagination côté serveur.
 *
 * @param {string} resource - Nom de la ressource API (ex: 'merchants', 'payments')
 * @param {Object} options
 * @param {Function} options.mapper - Fonction de mapping API → UI (ex: mapMerchant)
 * @param {number} [options.perPage=15] - Nombre d'éléments par page
 * @param {Object} [options.defaultFilters={}] - Filtres par défaut
 * @param {Function} [options.apiCall] - Appel API personnalisé (remplace listApi)
 * @returns {Object}
 */
export function usePagination(resource, options = {}) {
  const {
    mapper = (item) => item,
    perPage = 15,
    defaultFilters = {},
    apiCall = null,
  } = options;

  const items = ref([]);
  const currentPage = ref(1);
  const totalItems = ref(0);
  const totalPages = ref(1);
  const pageSize = ref(perPage);
  const loading = ref(false);
  const error = ref('');
  const filters = ref({ ...defaultFilters });

  const paginationInfo = computed(() => ({
    from: totalItems.value > 0 ? (currentPage.value - 1) * pageSize.value + 1 : 0,
    to: Math.min(currentPage.value * pageSize.value, totalItems.value),
    total: totalItems.value,
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    perPage: pageSize.value,
  }));

  async function fetchPage(page = 1) {
    loading.value = true;
    error.value = '';

    const params = {
      page,
      per_page: pageSize.value,
      ...filters.value,
    };

    // Retire les filtres vides
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    try {
      const response = apiCall
        ? await apiCall(params)
        : await listApi(resource, params);

      // Laravel paginate retourne { data: [], current_page, last_page, total, per_page }
      if (response && typeof response === 'object' && Array.isArray(response.data)) {
        items.value = response.data.map(mapper);
        currentPage.value = response.current_page || page;
        totalItems.value = response.total || response.data.length;
        totalPages.value = response.last_page || Math.ceil(totalItems.value / pageSize.value);
      } else if (Array.isArray(response)) {
        items.value = response.map(mapper);
        totalItems.value = response.length;
        currentPage.value = 1;
        totalPages.value = 1;
      } else {
        items.value = [];
        totalItems.value = 0;
      }
    } catch (err) {
      error.value = err?.message || 'Erreur lors du chargement.';
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    fetchPage(page);
  }

  function nextPage() {
    goToPage(currentPage.value + 1);
  }

  function previousPage() {
    goToPage(currentPage.value - 1);
  }

  function setFilter(key, value) {
    filters.value = { ...filters.value, [key]: value };
    currentPage.value = 1;
    fetchPage(1);
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
    currentPage.value = 1;
    fetchPage(1);
  }

  function resetFilters() {
    filters.value = { ...defaultFilters };
    currentPage.value = 1;
    fetchPage(1);
  }

  function refresh() {
    fetchPage(currentPage.value);
  }

  function setPageSize(size) {
    pageSize.value = size;
    currentPage.value = 1;
    fetchPage(1);
  }

  return {
    items,
    currentPage,
    totalItems,
    totalPages,
    pageSize,
    loading,
    error,
    filters,
    paginationInfo,
    fetchPage,
    goToPage,
    nextPage,
    previousPage,
    setFilter,
    setFilters,
    resetFilters,
    refresh,
    setPageSize,
  };
}
