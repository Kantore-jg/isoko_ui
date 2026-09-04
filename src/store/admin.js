import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  createPermissionApi,
  createRoleApi,
  createUserApi,
  deletePermissionApi,
  deleteRoleApi,
  deleteUserApi,
  listApi,
  listPermissionsApi,
  listRolesApi,
  listUsersApi,
  settingsApi,
  updatePermissionApi,
  updateRoleApi,
  updateSettingsApi,
  updateUserApi,
} from '../services/marketApi.js';
import { mapCurrentUser, mapMarket, mapPermission, mapRole, mapAuditLog } from '../services/apiMappers.js';

export const useAdminStore = defineStore('admin', () => {
  const users = ref([]);
  const roles = ref([]);
  const permissions = ref([]);
  const auditLogs = ref([]);
  const market = ref(null);
  const settings = ref([]);
  const dashboardSummary = ref(null);

  function setUsers(data) { users.value = data; }
  function setRoles(data) { roles.value = data; }
  function setPermissions(data) { permissions.value = data; }
  function setAuditLogs(data) { auditLogs.value = data; }
  function setMarket(data) { market.value = data; }
  function setSettings(data) { settings.value = data; }
  function setDashboardSummary(data) { dashboardSummary.value = data; }

  async function loadUsers() {
    const response = await listUsersApi({ per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    users.value = data.map(mapCurrentUser);
    return users.value;
  }

  async function loadRoles() {
    const response = await listRolesApi({ per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    roles.value = data.map(mapRole);
    return roles.value;
  }

  async function loadPermissions() {
    const response = await listPermissionsApi({ per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    permissions.value = data.map(mapPermission);
    return permissions.value;
  }

  async function loadAuditLogs() {
    const response = await listApi('audit-logs', { per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    auditLogs.value = data.map(mapAuditLog);
    return auditLogs.value;
  }

  async function loadMarketSettings() {
    const response = await settingsApi();
    market.value = mapMarket(response.market, null, response.settings || []);
    settings.value = response.settings || [];
    return { market: market.value, settings: settings.value };
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
    const role = roles.value.find((item) => item.id === Number(data.roleId) || item.code === data.role || item.code === data.roleCode)
      || roles.value.find((item) => item.code === 'ADMIN')
      || roles.value[0];

    if (!role) throw new Error('Aucun rôle disponible pour créer un utilisateur.');

    await createUserApi({
      role_id: role.id,
      name: data.name?.trim(),
      username: data.username?.trim() || makeUsername(data.name, data.email),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      password: data.password || 'password123',
      status: data.status || 'ACTIVE',
    });
  }

  async function updateUser(userId, data) {
    const role = roles.value.find((item) => item.id === Number(data.roleId) || item.code === data.role || item.code === data.roleCode);

    await updateUserApi(userId, {
      role_id: role?.id,
      name: data.name?.trim(),
      username: data.username?.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      password: data.password || undefined,
      status: data.status || undefined,
    });
  }

  async function deleteUser(userId) {
    await deleteUserApi(userId);
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
        { key: 'currency_code', value: data.currency, type: 'string', description: 'Devise principale du marché' },
        { key: 'receipt_prefix', value: data.receiptPrefix || 'REC', type: 'string', description: 'Préfixe utilisé pour générer les reçus' },
      ],
    });
  }

  async function addRole(data) {
    await createRoleApi({
      code: data.code,
      name: data.name,
      description: data.description || '',
      permission_ids: data.permissionIds || [],
    });
  }

  async function updateRole(id, data) {
    await updateRoleApi(id, {
      code: data.code,
      name: data.name,
      description: data.description || '',
      permission_ids: data.permissionIds || [],
    });
  }

  async function deleteRole(id) {
    await deleteRoleApi(id);
  }

  async function addPermission(data) {
    await createPermissionApi({
      code: data.code,
      name: data.name,
      module: data.module,
      description: data.description || '',
    });
  }

  async function updatePermission(id, data) {
    await updatePermissionApi(id, {
      code: data.code,
      name: data.name,
      module: data.module,
      description: data.description || '',
    });
  }

  async function deletePermission(id) {
    await deletePermissionApi(id);
  }

  function clear() {
    users.value = [];
    roles.value = [];
    permissions.value = [];
    auditLogs.value = [];
    market.value = null;
    settings.value = [];
    dashboardSummary.value = null;
  }

  return {
    users,
    roles,
    permissions,
    auditLogs,
    market,
    settings,
    dashboardSummary,
    setUsers,
    setRoles,
    setPermissions,
    setAuditLogs,
    setMarket,
    setSettings,
    setDashboardSummary,
    loadUsers,
    loadRoles,
    loadPermissions,
    loadAuditLogs,
    loadMarketSettings,
    addUser,
    updateUser,
    deleteUser,
    updateMarket,
    addRole,
    updateRole,
    deleteRole,
    addPermission,
    updatePermission,
    deletePermission,
    clear,
  };
});
