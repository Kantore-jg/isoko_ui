<template>
  <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Banques partenaires</h2>
        <p class="mt-1 text-xs text-slate-500">Création et édition des comptes récepteurs.</p>
      </div>
      <button
        class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="openCreate"
      >
        Nouvelle banque
      </button>
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
        <div class="mt-4 flex justify-end">
          <button class="text-xs font-semibold text-emerald-700 hover:underline" @click="openEdit(bank)">
            Modifier
          </button>
        </div>
      </article>
    </div>

    <PaginationControls v-model:currentPage="currentPage" :page-size="pageSize" :total-items="banks.length" />

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
import { marketStore } from '../../store/index.js';

const banks = computed(() => marketStore.state.banks || []);
const currentPage = ref(1);
const pageSize = 6;
const isOpen = ref(false);
const editingBank = ref(null);
const form = reactive({
  code: '',
  name: '',
  accountNumber: '',
  branch: '',
  isActive: true,
});

function resetForm(bank = null) {
  editingBank.value = bank;
  form.code = bank?.code || '';
  form.name = bank?.name || '';
  form.accountNumber = bank?.accountNumber || '';
  form.branch = bank?.branch || '';
  form.isActive = bank?.isActive ?? true;
}

const paginatedBanks = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return banks.value.slice(start, start + pageSize);
});

function openCreate() {
  resetForm();
  isOpen.value = true;
}

function openEdit(bank) {
  resetForm(bank);
  isOpen.value = true;
}

function save() {
  const payload = {
    code: form.code.trim(),
    name: form.name.trim(),
    accountNumber: form.accountNumber.trim(),
    branch: form.branch.trim(),
    isActive: Boolean(form.isActive),
  };

  if (editingBank.value) {
    marketStore.updateBank(editingBank.value.id, payload);
  } else {
    marketStore.addBank(payload);
  }

  close();
}

function close() {
  isOpen.value = false;
  editingBank.value = null;
}

watch(banks, () => {
  const totalPages = Math.max(1, Math.ceil(banks.value.length / pageSize));
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages;
  }
});
</script>
