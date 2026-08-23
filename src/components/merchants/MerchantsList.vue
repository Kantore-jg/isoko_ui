<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Répertoire des Commerçants</h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Fichier central des occupants, coordonnées d'identité et statuts d'activité
        </p>
      </div>

      <button
        v-if="canEdit"
        class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        <span>Nouveau Commerçant</span>
      </button>
    </div>

    <div class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            :class="statusFilter === option.value ? option.activeClass : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'"
            @click="statusFilter = option.value"
          >
            {{ option.label }} ({{ option.count }})
          </button>
        </div>

        <div class="relative w-full md:w-80">
          <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher par nom, CNI, place, téléphone..."
            class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="merchant in filteredMerchants"
        :key="merchant.id"
        class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
      >
        <div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-800">
                {{ initials(merchant.name) }}
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">{{ merchant.name }}</h3>
                <p class="text-xs text-slate-500">{{ merchant.activity || merchant.category || 'Activité non définie' }}</p>
              </div>
            </div>

            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-bold"
              :class="merchant.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
            >
              {{ merchant.status === 'ACTIVE' ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <div class="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-1.5 text-[11px] text-slate-400">
                <CreditCard class="h-3 w-3" /> CNI :
              </span>
              <span class="font-mono font-semibold text-slate-800">{{ merchant.cni }}</span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Phone class="h-3 w-3" /> Tél :
              </span>
              <span class="font-mono text-slate-700">{{ merchant.phone }}</span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-1.5 text-[11px] text-slate-400">
                <MapPin class="h-3 w-3" /> Emplacement :
              </span>
              <span
                v-if="merchant.currentPlaceCode"
                class="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800"
              >
                {{ merchant.currentPlaceCode }}
              </span>
              <span v-else class="italic text-slate-400">Non assigné</span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-1.5 text-[11px] text-slate-400">
                <FileText class="h-3 w-3" /> Adresse :
              </span>
              <span class="truncate text-slate-700">{{ merchant.address || merchant.notes || 'Non renseignée' }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <span>Inscrit le {{ merchant.registrationDate }}</span>
          <button v-if="canEdit" class="font-semibold text-emerald-700 hover:underline" @click="openEdit(merchant)">
            Modifier
          </button>
        </div>
      </article>
    </div>

    <div v-if="filteredMerchants.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      Aucun commerçant ne correspond aux filtres actifs.
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
            <input v-model="form.activity" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Adresse</label>
            <input v-model="form.address" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none">
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
import { CreditCard, FileText, MapPin, Phone, Plus, Search } from 'lucide-vue-next';
import { marketStore } from '../../store/index.js';

const merchants = computed(() => marketStore.state.merchants || []);
const currentUser = computed(() => marketStore.state.currentUser || { role: 'SUPER_ADMIN' });
const searchQuery = ref('');
const statusFilter = ref('ALL');
const isOpen = ref(false);
const editingMerchant = ref(null);

const form = reactive({
  name: '',
  phone: '',
  cni: '',
  activity: '',
  address: '',
  status: 'ACTIVE',
});

const canEdit = computed(() => currentUser.value.role !== 'ACCOUNTANT');

const filteredMerchants = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return merchants.value.filter((merchant) => {
    const matchStatus = statusFilter.value === 'ALL' || merchant.status === statusFilter.value;
    const matchSearch =
      !query ||
      [merchant.name, merchant.phone, merchant.cni, merchant.activity || merchant.category, merchant.currentPlaceCode, merchant.address || merchant.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    return matchStatus && matchSearch;
  });
});

const statusOptions = computed(() => [
  { value: 'ALL', label: 'Tous', count: merchants.value.length, activeClass: 'border border-slate-900 bg-slate-900 text-white' },
  { value: 'ACTIVE', label: 'Actifs', count: merchants.value.filter((merchant) => merchant.status === 'ACTIVE').length, activeClass: 'border border-emerald-700 bg-emerald-700 text-white' },
  { value: 'INACTIVE', label: 'Inactifs / Archivés', count: merchants.value.filter((merchant) => merchant.status === 'INACTIVE').length, activeClass: 'border border-slate-700 bg-slate-700 text-white' },
]);

function initials(name = '') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function resetForm(merchant = null) {
  editingMerchant.value = merchant;
  form.name = merchant?.name || '';
  form.phone = merchant?.phone || '+257 79 ';
  form.cni = merchant?.cni || '';
  form.activity = merchant?.activity || merchant?.category || '';
  form.address = merchant?.address || merchant?.notes || '';
  form.status = merchant?.status || 'ACTIVE';
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
    category: form.activity.trim(),
    activity: form.activity.trim(),
    address: form.address.trim(),
    notes: form.address.trim(),
    status: form.status,
    registrationDate: editingMerchant.value?.registrationDate || new Date().toISOString().slice(0, 10),
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
