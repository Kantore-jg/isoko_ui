<template>
  <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Commerçants</h2>
        <p class="mt-1 text-xs text-slate-500">Répertoire, statut et création d’un commerçant.</p>
      </div>
      <button
        class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="openCreate"
      >
        Nouveau commerçant
      </button>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="option in ['ALL', 'ACTIVE', 'INACTIVE']"
        :key="option"
        class="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors"
        :class="statusFilter === option ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'"
        @click="statusFilter = option"
      >
        {{ option === 'ALL' ? 'Tous' : option === 'ACTIVE' ? 'Actifs' : 'Inactifs' }}
      </button>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="merchant in filteredMerchants" :key="merchant.id" class="rounded-2xl border border-slate-200 p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="text-sm font-bold text-slate-900">{{ merchant.name }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ merchant.category }}</p>
          </div>
          <span :class="merchant.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'" class="rounded-full px-2 py-1 text-[10px] font-bold">
            {{ merchant.status }}
          </span>
        </div>
        <div class="mt-3 space-y-1 text-xs text-slate-600">
          <p>{{ merchant.phone }}</p>
          <p>{{ merchant.cni }}</p>
          <p>{{ merchant.currentPlaceCode || 'Aucune place' }}</p>
        </div>
        <div class="mt-4 flex justify-end">
          <button class="text-xs font-semibold text-emerald-700 hover:underline" @click="openEdit(merchant)">
            Modifier
          </button>
        </div>
      </article>
    </div>

    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">
          {{ editingMerchant ? 'Modifier le commerçant' : 'Enregistrer un nouveau commerçant' }}
        </h3>

        <form class="space-y-4 text-xs" @submit.prevent="save">
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Nom et prénom *</label>
            <input v-model="form.name" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Téléphone *</label>
              <input v-model="form.phone" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </div>
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Statut *</label>
              <select v-model="form.status" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
                <option value="ACTIVE">ACTIF</option>
                <option value="INACTIVE">INACTIF</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">CNI *</label>
            <input v-model="form.cni" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Activité *</label>
            <input v-model="form.category" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Adresse</label>
            <input v-model="form.notes" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none">
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="close">
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              {{ editingMerchant ? 'Enregistrer' : 'Créer le commerçant' }}
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

const statusFilter = ref('ALL');
const isOpen = ref(false);
const editingMerchant = ref(null);
const form = reactive({
  name: '',
  phone: '',
  cni: '',
  category: '',
  status: 'ACTIVE',
  notes: '',
});

const filteredMerchants = computed(() =>
  marketStore.state.merchants.filter((merchant) => statusFilter.value === 'ALL' || merchant.status === statusFilter.value)
);

function resetForm(merchant = null) {
  editingMerchant.value = merchant;
  form.name = merchant?.name || '';
  form.phone = merchant?.phone || '';
  form.cni = merchant?.cni || '';
  form.category = merchant?.category || '';
  form.status = merchant?.status || 'ACTIVE';
  form.notes = merchant?.notes || '';
}

function openCreate() {
  resetForm();
  isOpen.value = true;
}

function openEdit(merchant) {
  resetForm(merchant);
  isOpen.value = true;
}

function save() {
  const payload = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    cni: form.cni.trim(),
    category: form.category.trim(),
    status: form.status,
    registrationDate: editingMerchant.value?.registrationDate || new Date().toISOString().slice(0, 10),
    notes: form.notes.trim(),
  };

  if (editingMerchant.value) {
    marketStore.updateMerchant(editingMerchant.value.id, payload);
  } else {
    marketStore.addMerchant(payload);
  }

  close();
}

function close() {
  isOpen.value = false;
  editingMerchant.value = null;
}
</script>
