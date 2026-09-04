import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { getStoredToken, setStoredToken } from '../services/apiClient.js';
import { loginApi, logoutApi, meApi } from '../services/marketApi.js';
import { mapCurrentUser } from '../services/apiMappers.js';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null);
  const authToken = ref('');
  const authError = ref('');
  const ready = ref(false);

  function hasPermission(permission) {
    return currentUser.value?.permissions?.includes(permission) ?? false;
  }

  function hasAnyPermission(permissions) {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some((p) => hasPermission(p));
  }

  function permissionSet() {
    return new Set(currentUser.value?.permissions || []);
  }

  async function fetchCurrentUser() {
    const response = await meApi();
    const user = mapCurrentUser(response.user);
    currentUser.value = user;
    return user;
  }

  async function login(credentials) {
    authError.value = '';
    const response = await loginApi(credentials);
    setStoredToken(response.access_token);
    authToken.value = response.access_token;
    return mapCurrentUser(response.user);
  }

  async function logout() {
    try {
      await logoutApi();
    } catch {
      //
    }
    setStoredToken('');
    authToken.value = '';
    currentUser.value = null;
  }

  async function initSession() {
    const token = getStoredToken();
    if (!token) {
      authToken.value = '';
      currentUser.value = null;
      ready.value = true;
      return null;
    }
    authToken.value = token;
    try {
      const user = await fetchCurrentUser();
      ready.value = true;
      return user;
    } catch (error) {
      authError.value = error?.message || 'Impossible de charger la session.';
      setStoredToken('');
      authToken.value = '';
      currentUser.value = null;
      ready.value = true;
      return null;
    }
  }

  function setUser(user) {
    currentUser.value = user;
  }

  return {
    currentUser,
    authToken,
    authError,
    ready,
    hasPermission,
    hasAnyPermission,
    permissionSet,
    fetchCurrentUser,
    login,
    logout,
    initSession,
    setUser,
  };
});
