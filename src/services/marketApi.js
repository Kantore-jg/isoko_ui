import { apiRequest } from './apiClient.js';

export function loginApi(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: payload,
    token: '',
  });
}

export function meApi() {
  return apiRequest('/auth/me');
}

export function logoutApi() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

export function dashboardSummaryApi() {
  return apiRequest('/dashboard/summary');
}

export function listMerchantsApi(params = {}) {
  return listApi('merchants', params);
}

export function createMerchantApi(payload) {
  return apiRequest('/merchants', { method: 'POST', body: payload });
}

export function updateMerchantApi(id, payload) {
  return apiRequest(`/merchants/${id}`, { method: 'PUT', body: payload });
}

export function deleteMerchantApi(id) {
  return apiRequest(`/merchants/${id}`, { method: 'DELETE' });
}

export function listUsersApi(params = {}) {
  return listApi('users', params);
}

export function createUserApi(payload) {
  return apiRequest('/users', { method: 'POST', body: payload });
}

export function updateUserApi(id, payload) {
  return apiRequest(`/users/${id}`, { method: 'PUT', body: payload });
}

export function deleteUserApi(id) {
  return apiRequest(`/users/${id}`, { method: 'DELETE' });
}

export function listBanksApi(params = {}) {
  return listApi('banks', params);
}

export function createBankApi(payload) {
  return apiRequest('/banks', { method: 'POST', body: payload });
}

export function updateBankApi(id, payload) {
  return apiRequest(`/banks/${id}`, { method: 'PUT', body: payload });
}

export function deleteBankApi(id) {
  return apiRequest(`/banks/${id}`, { method: 'DELETE' });
}

export function listBlocksApi(params = {}) {
  return listApi('blocks', params);
}

export function createBlockApi(payload) {
  return apiRequest('/blocks', { method: 'POST', body: payload });
}

export function updateBlockApi(id, payload) {
  return apiRequest(`/blocks/${id}`, { method: 'PUT', body: payload });
}

export function deleteBlockApi(id) {
  return apiRequest(`/blocks/${id}`, { method: 'DELETE' });
}

export function listPlacesApi(params = {}) {
  return listApi('places', params);
}

export function createPlaceApi(payload) {
  return apiRequest('/places', { method: 'POST', body: payload });
}

export function updatePlaceApi(id, payload) {
  return apiRequest(`/places/${id}`, { method: 'PUT', body: payload });
}

export function deletePlaceApi(id) {
  return apiRequest(`/places/${id}`, { method: 'DELETE' });
}

export function createAssignmentApi(payload) {
  return apiRequest('/assignments', { method: 'POST', body: payload });
}

export function updateAssignmentApi(id, payload) {
  return apiRequest(`/assignments/${id}`, { method: 'PUT', body: payload });
}

export function terminateAssignmentApi(id, payload) {
  return apiRequest(`/assignments/${id}/terminate`, { method: 'POST', body: payload });
}

export function listPaymentsApi(params = {}) {
  return listApi('payments', params);
}

export function createPaymentApi(payload) {
  return apiRequest('/payments', { method: 'POST', body: payload });
}

export function showPaymentApi(id) {
  return apiRequest(`/payments/${id}`);
}

export function voidPaymentApi(id, payload) {
  return apiRequest(`/payments/${id}/void`, { method: 'POST', body: payload });
}

export function previewPaymentAllocationApi(payload) {
  return apiRequest('/payments/preview-allocation', { method: 'POST', body: payload });
}

export function listReceiptsApi(params = {}) {
  return listApi('receipts', params);
}

export function showReceiptApi(id) {
  return apiRequest(`/receipts/${id}`);
}

export function cancelReceiptApi(id, payload = {}) {
  return apiRequest(`/receipts/${id}/cancel`, { method: 'POST', body: payload });
}

export function settingsApi() {
  return apiRequest('/settings');
}

export function updateSettingsApi(payload) {
  return apiRequest('/settings', { method: 'PUT', body: payload });
}

export function listRolesApi(params = {}) {
  return listApi('roles', params);
}

export function createRoleApi(payload) {
  return apiRequest('/roles', { method: 'POST', body: payload });
}

export function updateRoleApi(id, payload) {
  return apiRequest(`/roles/${id}`, { method: 'PUT', body: payload });
}

export function deleteRoleApi(id) {
  return apiRequest(`/roles/${id}`, { method: 'DELETE' });
}

export function listPermissionsApi(params = {}) {
  return listApi('permissions', params);
}

export function createPermissionApi(payload) {
  return apiRequest('/permissions', { method: 'POST', body: payload });
}

export function updatePermissionApi(id, payload) {
  return apiRequest(`/permissions/${id}`, { method: 'PUT', body: payload });
}

export function deletePermissionApi(id) {
  return apiRequest(`/permissions/${id}`, { method: 'DELETE' });
}

export function exportExcelApi(scope = 'all') {
  const suffix = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  return apiRequest(`/exports/excel${suffix}`, { responseType: 'blob' });
}

export function templateExcelApi(scope = 'all') {
  const suffix = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  return apiRequest(`/imports/template-excel${suffix}`, { responseType: 'blob' });
}

export function importExcelApi(file, scope = 'all') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('scope', scope);

  return apiRequest('/imports/excel', {
    method: 'POST',
    body: formData,
  });
}

export function listApi(resource, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/${resource}${suffix}`);
}
