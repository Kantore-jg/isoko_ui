<template>
  <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Banques partenaires</h2>
        <p class="mt-1 text-xs text-slate-500">Création et édition des comptes récepteurs.</p>
      </div>
      <div class="flex flex-col gap-2 sm:min-w-80 lg:items-end">
        <label class="w-full">
          <span class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Rechercher</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Code, nom, compte, agence..."
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B2CC1]/20"
          >
        </label>
        <button
          class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
          @click="openCreate"
        >
          Nouvelle banque
        </button>
      </div>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="bank in paginatedBanks" :key="bank.id" class="rounded-2xl border border-slate-200 p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="text-sm font-bold text-slate-900">{{ bank.code }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ bank.name }}</p>
          </div>
          <span :class="bank.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'" class="rounded-full px-2 py-1 text-[10px] font-bold">
            {{ bank.isActive ? 'ACTIVE' : 'INACTIVE' }}
          </span>
        </div>
        <div class="mt-3 space-y-1 text-xs text-slate-600">
          <p>{{ bank.accountNumber }}</p>
          <p>{{ bank.branch || 'Agence non précisée' }}</p>
          <p>{{ bank.totalCollected.toLocaleString() }} FBu</p>
        </div>
        <div class="mt-4 flex justify-end gap-3">
          <button class="text-xs font-semibold text-emerald-700 hover:underline" @click="openEdit(bank)">
            Modifier
          </button>
          <button class="text-xs font-semibold text-rose-700 hover:underline" @click="removeBank(bank)">
            Supprimer
          </button>
        </div>
      </article>
    </div>

    <DataStatePanel
      :loading="isLoading"
      :error="dataError"
      :empty="filteredBanks.length === 0 && !isLoading && !dataError"
      title="Banques"
      loading-message="Chargement des banques..."
      error-message="Impossible de charger les banques."
      empty-message="Aucune banque ne correspond à la recherche."
    />

    <p v-if="formError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
      {{ formError }}
    </p>

    <PaginationControls
      v-if="!isLoading && !dataError && filteredBanks.length > 0"
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total-items="filteredBanks.length"
    />

    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">
          {{ editingBank ? 'Modifier la banque' : 'Ajouter une banque' }}
        </h3>

        <form class="space-y-4 text-xs" @submit.prevent="save">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Code *</label>
              <input v-model="form.code" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </div>
            <div class="col-span-2">
              <label class="mb-1 block font-semibold text-slate-700">Nom *</label>
              <input v-model="form.name" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </div>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Numéro de compte *</label>
            <input v-model="form.accountNumber" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Agence</label>
              <input v-model="form.branch" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none">
            </div>
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Statut</label>
              <select v-model="form.isActive" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none">
                <option :value="true">ACTIVE</option>
                <option :value="false">INACTIVE</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="close">
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              {{ editingBank ? 'Enregistrer' : 'Créer la banque' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import PaginationControls from '../common/PaginationControls.vue';
import DataStatePanel from '../common/DataStatePanel.vue';
import { marketStore } from '../../store/index.js';

const banks = computed(() => marketStore.state.banks || []);
const isLoading = computed(() => marketStore.state.isLoadingData);
const dataError = computed(() => marketStore.state.dataError || '');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 6;
const isOpen = ref(false);
const editingBank = ref(null);
const formError = ref('');
const form = reactive({
  code: '',
  name: '',
  accountNumber: '',
  branch: '',
  isActive: true,
});

const filteredBanks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return banks.value;

  return banks.value.filter((bank) =>
    [bank.code, bank.name, bank.accountNumber, bank.branch]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
});

function resetForm(bank = null) {
  editingBank.value = bank;
  form.code = bank?.code || '';
  form.name = bank?.name || '';
  form.accountNumber = bank?.accountNumber || '';
  form.branch = bank?.branch || '';
  form.isActive = bank?.isActive ?? true;
  formError.value = '';
}

const paginatedBanks = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredBanks.value.slice(start, start + pageSize);
});

function openCreate() {
  resetForm();
  isOpen.value = true;
}

function openEdit(bank) {
  resetForm(bank);
  isOpen.value = true;
}

async function save() {
  const payload = {
    code: form.code.trim(),
    name: form.name.trim(),
    accountNumber: form.accountNumber.trim(),
    branch: form.branch.trim(),
    isActive: Boolean(form.isActive),
  };

  try {
    if (editingBank.value) {
      await marketStore.updateBank(editingBank.value.id, payload);
    } else {
      await marketStore.addBank(payload);
    }
    close();
  } catch (error) {
    formError.value = error?.payload?.message || error?.message || 'Impossible d’enregistrer la banque.';
  }
}

function close() {
  isOpen.value = false;
  editingBank.value = null;
  formError.value = '';
}

async function removeBank(bank) {
  const confirmed = window.confirm(`Supprimer la banque ${bank.name} ?`);
  if (!confirmed) return;

  try {
    await marketStore.deleteBank(bank.id);
  } catch (error) {
    formError.value = error?.payload?.message || error?.message || 'Impossible de supprimer la banque.';
  }
}

watch(banks, () => {
  const totalPages = Math.max(1, Math.ceil(filteredBanks.value.length / pageSize));
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages;
  }
});

watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>
