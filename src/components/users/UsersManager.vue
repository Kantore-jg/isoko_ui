<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Utilisateurs & rôles</h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Créez et gérez les comptes de commissaire du marché ou d'admin marché.
        </p>
      </div>

      <div class="flex flex-col gap-2 sm:min-w-80 sm:items-end">
        <label class="w-full">
          <span class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Rechercher</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Nom, email, téléphone, rôle..."
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B2CC1]/20"
          >
        </label>

        <button
          class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
          @click="openCreate"
        >
          Ajouter un utilisateur
        </button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3 text-center text-xs">
      <div class="rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <p class="text-[10px] font-semibold uppercase text-slate-400">Total</p>
        <p class="mt-1 text-sm font-bold text-slate-900">{{ users.length }}</p>
      </div>
      <div class="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-3 py-2">
        <p class="text-[10px] font-semibold uppercase text-emerald-600">Admins Marché</p>
        <p class="mt-1 text-sm font-bold text-emerald-700">{{ adminCount }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p class="text-[10px] font-semibold uppercase text-slate-500">Actif</p>
        <p class="mt-1 text-sm font-bold text-slate-900">{{ currentUser?.name }}</p>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 px-5 py-4">
        <h3 class="text-sm font-bold text-slate-900">Comptes existants</h3>
        <p class="mt-0.5 text-xs text-slate-500">Modifiez ou supprimez les comptes, ou activez celui que vous voulez utiliser.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Nom</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Téléphone</th>
              <th class="px-4 py-3">Profil</th>
              <th class="px-4 py-3">Titre</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="transition-colors hover:bg-slate-50/70"
              :class="user.id === currentUser?.id ? 'bg-emerald-50/40' : ''"
            >
              <td class="px-4 py-3">
                <p class="font-bold text-slate-900">{{ user.name }}</p>
                <p class="text-[11px] text-slate-400">{{ user.id }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ user.email }}</td>
              <td class="px-4 py-3 font-mono text-slate-700">{{ user.phone || '—' }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  :class="user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : user.role === 'SUPER_ADMIN' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'"
                >
                  {{ roleLabel(user.role) }}
                </span>
              </td>
              <td class="px-4 py-3 font-semibold text-emerald-700">{{ user.title }}</td>
              <td class="px-4 py-3">
                <span class="text-[11px] font-semibold" :class="user.id === currentUser?.id ? 'text-emerald-700' : 'text-slate-500'">
                  {{ user.id === currentUser?.id ? 'Compte actif' : 'Disponible' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" @click="activate(user.id)">
                    Activer
                  </button>
                  <button
                    class="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="user.role === 'SUPER_ADMIN'"
                    @click="openEdit(user)"
                  >
                    Modifier
                  </button>
                  <button
                    class="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="user.id === currentUser?.id || user.role === 'SUPER_ADMIN'"
                    @click="removeUser(user)"
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!filteredUsers.length" class="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
        Aucun utilisateur ne correspond à la recherche.
      </p>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900">
              {{ editingUser ? 'Modifier un utilisateur' : 'Ajouter un utilisateur' }}
            </h3>
            <p class="mt-0.5 text-xs text-slate-500">Choisissez le profil métier et enregistrez le compte.</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {{ editingUser ? 'Modification' : 'Nouveau' }}
          </span>
        </div>

        <form class="space-y-4 text-xs" @submit.prevent="saveUser">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Nom complet *</span>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                required
              >
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Email *</span>
              <input
                v-model="form.email"
                type="email"
                class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                required
              >
            </label>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Téléphone *</span>
              <input
                v-model="form.phone"
                type="text"
                class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                required
              >
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Rôle *</span>
              <select
                v-model="form.roleId"
                class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                required
              >
                <option v-for="role in userRoles" :key="role.id" :value="role.id">
                  {{ role.name }} ({{ role.code }})
                </option>
              </select>
            </label>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Nom d’utilisateur *</span>
              <input
                v-model="form.username"
                type="text"
                class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                required
              >
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">{{ editingUser ? 'Nouveau mot de passe' : 'Mot de passe *' }}</span>
              <input
                v-model="form.password"
                type="password"
                class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                :required="!editingUser"
                :placeholder="editingUser ? 'Laisser vide pour conserver' : ''"
              >
            </label>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Aperçu</p>
            <p class="mt-1 text-sm font-bold text-slate-900">{{ previewTitle }}</p>
            <p class="text-xs text-slate-500">Rôle technique: {{ selectedRoleCode }}</p>
          </div>

          <p v-if="formError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {{ formError }}
          </p>

          <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              @click="closeModal"
            >
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              {{ editingUser ? 'Enregistrer' : "Ajouter l'utilisateur" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { marketStore } from '../../store/index.js';

const users = computed(() => marketStore.state.users || []);
const currentUser = computed(() => marketStore.state.currentUser || null);
const userRoles = computed(() => marketStore.state.roles || []);
const searchQuery = ref('');
const isModalOpen = ref(false);
const editingUser = ref(null);
const formError = ref('');

const form = reactive({
  name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  roleId: '',
});

const adminCount = computed(() => users.value.filter((user) => user.role === 'ADMIN').length);
const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return users.value;

  return users.value.filter((user) => {
    const role = roleLabel(user.role).toLowerCase();
    return [
      user.name,
      user.email,
      user.phone,
      user.username,
      user.title,
      role,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
});
const selectedRoleCode = computed(() => {
  const role = userRoles.value.find((item) => String(item.id) === String(form.roleId));
  return role?.code || 'ADMIN';
});
const previewTitle = computed(() => {
  if (selectedRoleCode.value === 'ACCOUNTANT') return 'Chef Comptable';
  if (selectedRoleCode.value === 'SUPER_ADMIN') return 'Directeur Général';
  return selectedRoleCode.value === 'ADMIN' ? 'Commissaire du Marché' : 'Utilisateur';
});

function roleLabel(role) {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'ADMIN') return 'Admin Marché';
  if (role === 'ACCOUNTANT') return 'Comptable';
  return role;
}

function resetForm() {
  form.name = '';
  form.email = '';
  form.phone = '';
  form.username = '';
  form.password = '';
  form.roleId = userRoles.value.find((role) => role.code === 'ADMIN')?.id || userRoles.value[0]?.id || '';
  formError.value = '';
}

function openCreate() {
  editingUser.value = null;
  resetForm();
  isModalOpen.value = true;
}

function openEdit(user) {
  if (user.role === 'SUPER_ADMIN') return;
  editingUser.value = user;
  form.name = user.name || '';
  form.email = user.email || '';
  form.phone = user.phone || '';
  form.username = user.username || user.email?.split('@')[0] || '';
  form.password = '';
  form.roleId = user.roleId || user.role_id || userRoles.value.find((role) => role.code === user.role)?.id || userRoles.value[0]?.id || '';
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingUser.value = null;
  resetForm();
}

async function saveUser() {
  const payload = {
    name: form.name,
    email: form.email,
    phone: form.phone,
    username: form.username,
    password: form.password,
    roleId: form.roleId,
    title: previewTitle.value,
  };

  try {
    if (editingUser.value) {
      await marketStore.updateUser(editingUser.value.id, payload);
    } else {
      await marketStore.addUser(payload);
    }
    closeModal();
  } catch (error) {
    formError.value = error?.payload?.message || error?.message || 'Impossible d’enregistrer l’utilisateur.';
  }
}

function activate(userId) {
  marketStore.setCurrentUser(userId);
}

async function removeUser(user) {
  if (user.id === currentUser.value?.id || user.role === 'SUPER_ADMIN') return;
  const confirmed = window.confirm(`Supprimer l'utilisateur ${user.name} ?`);
  if (!confirmed) return;
  await marketStore.deleteUser(user.id);
  if (editingUser.value?.id === user.id) {
    closeModal();
  }
}
</script>
