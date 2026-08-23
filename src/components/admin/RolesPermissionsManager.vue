<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Rôles & permissions</h2>
          <p class="mt-0.5 text-xs text-slate-500">Administration des accès et du périmètre fonctionnel.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200" @click="activeTab = 'ROLES'">
            Rôles ({{ roles.length }})
          </button>
          <button class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200" @click="activeTab = 'PERMISSIONS'">
            Permissions ({{ permissions.length }})
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'ROLES'" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Rôles</h3>
          <p class="text-xs text-slate-500">Créer, modifier ou supprimer les profils d’accès.</p>
        </div>
        <button class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700" @click="openRole">
          Nouveau rôle
        </button>
      </div>

      <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Code</th>
              <th class="px-4 py-3">Nom</th>
              <th class="px-4 py-3">Permissions</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="role in roles" :key="role.id">
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ role.code }}</td>
              <td class="px-4 py-3 text-slate-700">{{ role.name }}</td>
              <td class="px-4 py-3 text-slate-600">{{ role.permissions.length }} permissions</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="text-xs font-semibold text-emerald-700 hover:underline" @click="openRole(role)">Modifier</button>
                  <button class="text-xs font-semibold text-rose-700 hover:underline" @click="removeRole(role)">Supprimer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="errorMessage" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{{ errorMessage }}</p>
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Permissions</h3>
          <p class="text-xs text-slate-500">Créer et maintenir les permissions élémentaires.</p>
        </div>
        <button class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700" @click="openPermission">
          Nouvelle permission
        </button>
      </div>

      <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Code</th>
              <th class="px-4 py-3">Nom</th>
              <th class="px-4 py-3">Module</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="permission in permissions" :key="permission.id">
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ permission.code }}</td>
              <td class="px-4 py-3 text-slate-700">{{ permission.name }}</td>
              <td class="px-4 py-3 text-slate-600">{{ permission.module }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="text-xs font-semibold text-emerald-700 hover:underline" @click="openPermission(permission)">Modifier</button>
                  <button class="text-xs font-semibold text-rose-700 hover:underline" @click="removePermission(permission)">Supprimer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">{{ editingId ? 'Modifier' : 'Créer' }} {{ modalType === 'ROLE' ? 'un rôle' : 'une permission' }}</h3>

        <form class="space-y-4 text-xs" @submit.prevent="save">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Code *</span>
              <input v-model="form.code" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Nom *</span>
              <input v-model="form.name" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
          </div>

          <label class="block" v-if="modalType === 'ROLE'">
            <span class="mb-1 block font-semibold text-slate-700">Description</span>
            <textarea v-model="form.description" rows="3" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
          </label>

          <label class="block" v-else>
            <span class="mb-1 block font-semibold text-slate-700">Module *</span>
            <input v-model="form.module" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </label>

          <div v-if="modalType === 'ROLE'" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Permissions associées</p>
            <div class="grid gap-2 md:grid-cols-2">
              <label v-for="permission in permissions" :key="permission.id" class="flex items-center gap-2 text-xs text-slate-700">
                <input v-model="form.permissionIds" :value="permission.id" type="checkbox" class="text-emerald-600">
                <span>{{ permission.code }}</span>
              </label>
            </div>
          </div>

          <p v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {{ errorMessage }}
          </p>

          <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="close">
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              Enregistrer
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

const activeTab = ref('ROLES');
const modalOpen = ref(false);
const modalType = ref('ROLE');
const editingId = ref(null);
const errorMessage = ref('');

const roles = computed(() => marketStore.state.roles || []);
const permissions = computed(() => marketStore.state.permissions || []);

const form = reactive({
  code: '',
  name: '',
  description: '',
  module: '',
  permissionIds: [],
});

function resetForm() {
  form.code = '';
  form.name = '';
  form.description = '';
  form.module = '';
  form.permissionIds = [];
  errorMessage.value = '';
}

function openRole(role = null) {
  modalType.value = 'ROLE';
  editingId.value = role?.id || null;
  resetForm();
  if (role) {
    form.code = role.code || '';
    form.name = role.name || '';
    form.description = role.description || '';
    form.permissionIds = (role.permissions || []).map((permission) => permission.id);
  }
  modalOpen.value = true;
}

function openPermission(permission = null) {
  modalType.value = 'PERMISSION';
  editingId.value = permission?.id || null;
  resetForm();
  if (permission) {
    form.code = permission.code || '';
    form.name = permission.name || '';
    form.module = permission.module || '';
    form.description = permission.description || '';
  }
  modalOpen.value = true;
}

function close() {
  modalOpen.value = false;
  editingId.value = null;
  resetForm();
}

async function save() {
  try {
    if (modalType.value === 'ROLE') {
      if (editingId.value) {
        await marketStore.updateRole(editingId.value, { ...form });
      } else {
        await marketStore.addRole({ ...form });
      }
    } else if (editingId.value) {
      await marketStore.updatePermission(editingId.value, { ...form });
    } else {
      await marketStore.addPermission({ ...form });
    }
    close();
  } catch (error) {
    errorMessage.value = error?.payload?.message || error?.message || 'Enregistrement impossible.';
  }
}

async function removeRole(role) {
  const confirmed = window.confirm(`Supprimer le rôle ${role.name} ?`);
  if (!confirmed) return;
  await marketStore.deleteRole(role.id);
}

async function removePermission(permission) {
  const confirmed = window.confirm(`Supprimer la permission ${permission.name} ?`);
  if (!confirmed) return;
  await marketStore.deletePermission(permission.id);
}
</script>
