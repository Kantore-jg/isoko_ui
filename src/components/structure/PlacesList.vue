<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Répertoire des places du marché</h2>
        <p class="mt-0.5 text-xs text-slate-500">Inventaire des emplacements, tarifs spécifiques et statut d'affectation</p>
      </div>
      <button
        v-if="currentUser.role === 'ADMIN'"
        class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="openCreate"
      >
        Ajouter une place
      </button>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <select v-model="selectedBlock" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          <option value="ALL">Tous les blocs</option>
          <option v-for="block in blocks" :key="block.id" :value="block.id">{{ block.code }} ({{ block.category }})</option>
        </select>
        <select v-model="selectedStatus" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          <option value="ALL">Tous les statuts</option>
          <option value="OCCUPIED">Occupées</option>
          <option value="AVAILABLE">Disponibles</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      <div class="relative w-full md:w-72">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher place, commerçant..."
          class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
      </div>
    </div>

    <DataStatePanel
      :loading="isLoading"
      :error="dataError"
      :empty="filteredPlaces.length === 0 && !isLoading && !dataError"
      title="Places"
      loading-message="Chargement des places..."
      error-message="Impossible de charger les places."
      empty-message="Aucune place ne correspond aux filtres actifs."
    />

    <div v-if="!isLoading && !dataError && filteredPlaces.length > 0" class="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3">Code</th>
              <th class="px-4 py-3">Bloc</th>
              <th class="px-4 py-3">Catégorie & Surface</th>
              <th class="px-4 py-3">Loyer</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3">Occupant</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="place in paginatedPlaces" :key="place.id" class="transition-colors hover:bg-slate-50/80">
              <td class="px-4 py-3 font-mono text-sm font-bold text-slate-900">{{ place.code }}</td>
              <td class="px-4 py-3 font-semibold text-slate-700">{{ place.blockCode }}</td>
              <td class="px-4 py-3">
                <p class="font-medium text-slate-800">{{ place.category }}</p>
                <p class="text-[11px] text-slate-400">{{ place.surface }} m²</p>
              </td>
              <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ place.rentPrice.toLocaleString() }} FBu</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                  :class="place.status === 'OCCUPIED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : place.status === 'AVAILABLE' ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-slate-200 bg-slate-100 text-slate-700'">
                  {{ place.status === 'OCCUPIED' ? 'Occupée' : place.status === 'AVAILABLE' ? 'Disponible' : 'Maintenance' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span v-if="place.currentMerchantName" class="font-bold text-slate-900">{{ place.currentMerchantName }}</span>
                <span v-else class="italic text-slate-400">Aucun occupant</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="text-xs font-semibold text-emerald-700 hover:underline" @click="openEdit(place)">Modifier</button>
                  <button v-if="currentUser.role !== 'SUPER_ADMIN' && place.status === 'AVAILABLE'" class="text-xs font-semibold text-blue-700 hover:underline" @click="openAssign(place)">Affecter</button>
                  <button v-if="currentUser.role !== 'SUPER_ADMIN' && place.status === 'OCCUPIED'" class="text-xs font-semibold text-teal-700 hover:underline" @click="openTransfer(place)">Mutation</button>
                  <button v-if="currentUser.role !== 'SUPER_ADMIN' && place.status === 'OCCUPIED'" class="text-xs font-semibold text-rose-700 hover:underline" @click="openTerminate(place)">Libérer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PaginationControls
      v-if="!isLoading && !dataError && filteredPlaces.length > 0"
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total-items="filteredPlaces.length"
    />

    <div v-if="isCreateOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">{{ editingPlace ? 'Modifier la place' : 'Ajouter une place' }}</h3>
        <form class="space-y-4 text-xs" @submit.prevent="savePlace">
          <p v-if="formError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {{ formError }}
          </p>
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Bloc *</label>
            <select v-model="form.blockId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" @change="syncBlockSelection" required>
              <option v-for="block in blocks" :key="block.id" :value="block.id">{{ block.code }} ({{ block.name }})</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Code *</span>
              <input v-model="form.code" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono font-bold focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Surface *</span>
              <input v-model.number="form.surface" type="number" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Loyer *</span>
              <input v-model.number="form.rentPrice" type="number" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Statut</span>
              <select v-model="form.status" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none">
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </label>
          </div>
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Type de place *</label>
            <select v-model="form.category" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
              <option v-for="option in placeTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Notes</label>
            <textarea v-model="form.notes" rows="3" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
          </div>
          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="closeModals">Annuler</button>
            <button
              type="submit"
              class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Enregistrement…' : editingPlace ? 'Enregistrer' : 'Créer la place' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="assignTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">Affecter {{ assignTarget.code }}</h3>
        <form class="space-y-4 text-xs" @submit.prevent="submitAssign">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Commerçant *</span>
            <select v-model="assignForm.merchantId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
              <option v-for="merchant in activeMerchants" :key="merchant.id" :value="merchant.id">{{ merchant.name }}</option>
            </select>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Date *</span>
              <input v-model="assignForm.startDate" type="date" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Loyer *</span>
              <input v-model.number="assignForm.rentAmount" type="number" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold focus:bg-white focus:outline-none" required>
            </label>
          </div>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Motif</span>
            <textarea v-model="assignForm.notes" rows="2" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
          </label>
          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="closeModals">Annuler</button>
            <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Affecter</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="transferTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">Muter {{ transferTarget.code }}</h3>
        <form class="space-y-4 text-xs" @submit.prevent="submitTransfer">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Nouveau emplacement *</span>
            <select v-model="transferForm.toPlaceId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
              <option v-for="place in availableTransferTargets" :key="place.id" :value="place.id">{{ place.code }} ({{ place.blockCode }})</option>
            </select>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Date *</span>
              <input v-model="transferForm.date" type="date" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Loyer *</span>
              <input v-model.number="transferForm.rentAmount" type="number" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold focus:bg-white focus:outline-none" required>
            </label>
          </div>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Motif</span>
            <textarea v-model="transferForm.reason" rows="2" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
          </label>
          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="closeModals">Annuler</button>
            <button type="submit" class="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700">Muter</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="terminateTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">Libérer {{ terminateTarget.code }}</h3>
        <form class="space-y-4 text-xs" @submit.prevent="submitTerminate">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Date de fin *</span>
            <input v-model="terminateForm.endDate" type="date" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </label>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Motif *</span>
            <textarea v-model="terminateForm.reason" rows="3" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required />
          </label>
          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="closeModals">Annuler</button>
            <button type="submit" class="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700">Libérer</button>
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

const blocks = computed(() => marketStore.state.blocks);
const places = computed(() => marketStore.state.places);
const currentUser = computed(() => marketStore.state.currentUser || { role: 'SUPER_ADMIN' });
const isLoading = computed(() => marketStore.state.isLoadingData);
const dataError = computed(() => marketStore.state.dataError || '');
const activeMerchants = computed(() => marketStore.state.merchants.filter((merchant) => merchant.status === 'ACTIVE'));

const selectedBlock = ref('ALL');
const selectedStatus = ref('ALL');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 10;
const isCreateOpen = ref(false);
const editingPlace = ref(null);
const assignTarget = ref(null);
const transferTarget = ref(null);
const terminateTarget = ref(null);
const formError = ref('');
const isSaving = ref(false);

const placeTypeOptions = [
  { value: 'STANDARD', label: 'STANDARD' },
  { value: 'KIOSK', label: 'KIOSK' },
  { value: 'BOUTIQUE', label: 'BOUTIQUE' },
  { value: 'STALL', label: 'STALL' },
  { value: 'WAREHOUSE', label: 'WAREHOUSE' },
  { value: 'OTHER', label: 'OTHER' },
];

const form = reactive({
  blockId: '',
  code: '',
  rentPrice: 0,
  category: '',
  surface: 6,
  status: 'AVAILABLE',
  notes: '',
});

const assignForm = reactive({
  merchantId: '',
  startDate: '2026-08-23',
  rentAmount: 0,
  notes: '',
});

const transferForm = reactive({
  toPlaceId: '',
  date: '2026-08-23',
  rentAmount: 0,
  reason: '',
});

const terminateForm = reactive({
  endDate: '2026-08-23',
  reason: 'Départ / Fin de contrat',
});

const filteredPlaces = computed(() =>
  places.value.filter((place) => {
    const matchBlock = selectedBlock.value === 'ALL' || place.blockId === selectedBlock.value || place.blockCode === selectedBlock.value;
    const matchStatus = selectedStatus.value === 'ALL' || place.status === selectedStatus.value;
    const q = searchQuery.value.toLowerCase();
    const matchSearch =
      !q ||
      place.code.toLowerCase().includes(q) ||
      (place.currentMerchantName && place.currentMerchantName.toLowerCase().includes(q)) ||
      place.category.toLowerCase().includes(q);
    return matchBlock && matchStatus && matchSearch;
  })
);

const paginatedPlaces = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredPlaces.value.slice(start, start + pageSize);
});

const availableTransferTargets = computed(() =>
  places.value.filter((place) => place.status === 'AVAILABLE' && place.id !== transferTarget.value?.id)
);

function initCreateForm(block = blocks.value[0]) {
  form.blockId = block?.id || '';
  const count = places.value.filter((place) => place.blockId === block?.id).length + 1;
  const prefix = (block?.code || 'A').replace('Bloc ', '');
  form.code = `${prefix}-${String(count).padStart(3, '0')}`;
  form.rentPrice = block?.defaultRentPrice || 50000;
  form.category = 'STANDARD';
  form.surface = 6;
  form.status = 'AVAILABLE';
  form.notes = '';
  formError.value = '';
}

function openCreate() {
  editingPlace.value = null;
  initCreateForm();
  isCreateOpen.value = true;
}

function openEdit(place) {
  editingPlace.value = place;
  form.blockId = place.blockId;
  form.code = place.code;
  form.rentPrice = place.rentPrice;
  form.category = place.category;
  form.surface = place.surface;
  form.status = place.status;
  form.notes = place.notes || '';
  formError.value = '';
  isCreateOpen.value = true;
}

function syncBlockSelection() {
  const block = blocks.value.find((item) => item.id === form.blockId);
  if (!block) return;
  const count = places.value.filter((place) => place.blockId === block.id).length + 1;
  const prefix = block.code.replace('Bloc ', '');
  form.code = `${prefix}-${String(count).padStart(3, '0')}`;
  form.rentPrice = block.defaultRentPrice;
}

async function savePlace() {
  const block = blocks.value.find((item) => item.id === form.blockId);
  if (!block) return;

  const payload = {
    blockId: block.id,
    blockCode: block.code,
    code: form.code.trim(),
    rentPrice: Number(form.rentPrice) || 0,
    type: form.category,
    surface: Number(form.surface) || 6,
    status: form.status,
    notes: form.notes.trim(),
  };

  isSaving.value = true;
  formError.value = '';

  try {
    if (editingPlace.value) {
      await marketStore.updatePlace(editingPlace.value.id, payload);
    } else {
      await marketStore.addPlace(payload);
    }

    closeModals();
  } catch (error) {
    const validationErrors = error?.payload?.errors || {};
    const firstFieldError = Object.values(validationErrors).flat().find(Boolean);
    formError.value = firstFieldError || error?.payload?.message || error?.message || 'Impossible d’enregistrer la place.';
  } finally {
    isSaving.value = false;
  }
}

function openAssign(place) {
  assignTarget.value = place;
  assignForm.merchantId = activeMerchants.value[0]?.id || '';
  assignForm.startDate = '2026-08-23';
  assignForm.rentAmount = place.rentPrice;
  assignForm.notes = '';
}

async function submitAssign() {
  if (!assignTarget.value) return;
  await marketStore.assignPlace(assignTarget.value.id, assignForm.merchantId, assignForm.startDate, assignForm.rentAmount, assignForm.notes);
  closeModals();
}

function openTransfer(place) {
  transferTarget.value = place;
  transferForm.toPlaceId = availableTransferTargets.value[0]?.id || '';
  transferForm.date = '2026-08-23';
  transferForm.rentAmount = place.rentPrice;
  transferForm.reason = '';
}

async function submitTransfer() {
  if (!transferTarget.value) return;
  const currentAssignment = marketStore.state.assignments.find((assignment) => assignment.placeId === transferTarget.value.id && assignment.status === 'ACTIVE');
  if (!currentAssignment) return;
  await marketStore.transferPlace(currentAssignment.merchantId, transferTarget.value.id, transferForm.toPlaceId, transferForm.date, transferForm.reason, transferForm.rentAmount);
  closeModals();
}

function openTerminate(place) {
  terminateTarget.value = place;
  terminateForm.endDate = '2026-08-23';
  terminateForm.reason = 'Départ / Fin de contrat';
}

async function submitTerminate() {
  if (!terminateTarget.value) return;
  const assignment = marketStore.state.assignments.find((item) => item.placeId === terminateTarget.value.id && item.status === 'ACTIVE');
  if (!assignment) return;
  await marketStore.terminateAssignment(assignment.id, terminateForm.endDate, terminateForm.reason);
  closeModals();
}

function closeModals() {
  isCreateOpen.value = false;
  editingPlace.value = null;
  assignTarget.value = null;
  transferTarget.value = null;
  terminateTarget.value = null;
  formError.value = '';
  isSaving.value = false;
}

watch(
  () => blocks.value,
  () => {
    if (!form.blockId && blocks.value.length > 0) {
      initCreateForm(blocks.value[0]);
    }
  },
  { immediate: true }
);

watch([selectedBlock, selectedStatus, searchQuery], () => {
  currentPage.value = 1;
});

watch(filteredPlaces, () => {
  const totalPages = Math.max(1, Math.ceil(filteredPlaces.value.length / pageSize));
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages;
  }
});
</script>
