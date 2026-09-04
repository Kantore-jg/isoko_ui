<template>
  <section class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Tarifs de Loyer</h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Gestion des tarifs par bloc ou par place individuelle
        </p>
      </div>
      <button
        class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        <span>Nouveau Tarif</span>
      </button>
    </div>

    <!-- Filtres -->
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher (bloc, place…)"
          class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
      </div>

      <select
        v-model="filterScope"
        class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="">Tous les tarifs</option>
        <option value="block">Tarifs de bloc</option>
        <option value="place">Tarifs de place</option>
      </select>

      <select
        v-model="filterStatus"
        class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="">Tous les statuts</option>
        <option value="ACTIVE">Actif</option>
        <option value="INACTIVE">Inactif</option>
      </select>

      <span class="shrink-0 text-xs font-semibold text-slate-500">
        {{ filtered.length }} tarif(s)
      </span>
    </div>

    <!-- État de chargement / erreur / vide -->
    <div v-if="isLoading" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
      Chargement des tarifs…
    </div>
    <div v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
      {{ error }}
    </div>
    <div v-else-if="filtered.length === 0" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
      Aucun tarif de loyer enregistré.
    </div>

    <!-- Tableau -->
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-slate-100 text-xs">
        <thead class="bg-slate-50">
          <tr class="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            <th class="px-4 py-3">Portée</th>
            <th class="px-4 py-3">Bloc</th>
            <th class="px-4 py-3">Place</th>
            <th class="px-4 py-3 text-right">Montant (FBu)</th>
            <th class="px-4 py-3">Valide du</th>
            <th class="px-4 py-3">Valide au</th>
            <th class="px-4 py-3">Statut</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="rate in filtered"
            :key="rate.id"
            class="transition-colors hover:bg-slate-50"
          >
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  rate.scope === 'place'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-emerald-50 text-emerald-700',
                ]"
              >
                <component :is="rate.scope === 'place' ? MapPin : Building2" class="h-3 w-3" />
                {{ rate.scope === 'place' ? 'Place' : 'Bloc' }}
              </span>
            </td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ rate.blockCode || '—' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ rate.placeCode || '—' }}</td>
            <td class="px-4 py-3 text-right font-mono font-bold text-slate-900">
              {{ money(rate.amount) }}
            </td>
            <td class="px-4 py-3 text-slate-600">{{ rate.effectiveFrom || '—' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ rate.effectiveTo || 'Indéfinie' }}</td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-block rounded px-2 py-0.5 text-[10px] font-bold',
                  rate.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500',
                ]"
              >
                {{ rate.status === 'ACTIVE' ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  class="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  title="Modifier"
                  @click="openEdit(rate)"
                >
                  <Edit class="h-3.5 w-3.5" />
                </button>
                <button
                  class="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Supprimer"
                  @click="confirmDelete(rate)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal formulaire -->
    <div
      v-if="isFormOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      @click.self="closeForm"
    >
      <div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">
            {{ editingRate ? 'Modifier le tarif' : 'Nouveau tarif de loyer' }}
          </h3>
          <button class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" @click="closeForm">
            <X class="h-4 w-4" />
          </button>
        </div>

        <form class="space-y-4 text-xs" @submit.prevent="save">
          <!-- Portée -->
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Portée *</label>
            <div class="flex gap-3">
              <label class="flex cursor-pointer items-center gap-2">
                <input v-model="form.scope" type="radio" value="block" class="accent-emerald-600">
                <span>Tarif de bloc (toutes les places)</span>
              </label>
              <label class="flex cursor-pointer items-center gap-2">
                <input v-model="form.scope" type="radio" value="place" class="accent-emerald-600">
                <span>Tarif d'une place précise</span>
              </label>
            </div>
          </div>

          <!-- Bloc -->
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Bloc *</label>
            <select
              v-model.number="form.blockId"
              required
              class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
              @change="form.placeId = null"
            >
              <option :value="null" disabled>Sélectionner un bloc</option>
              <option v-for="block in blocks" :key="block.id" :value="block.id">
                {{ block.code }} — {{ block.name }}
              </option>
            </select>
          </div>

          <!-- Place (si portée = place) -->
          <div v-if="form.scope === 'place'">
            <label class="mb-1 block font-semibold text-slate-700">Place *</label>
            <select
              v-model.number="form.placeId"
              :required="form.scope === 'place'"
              class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
            >
              <option :value="null" disabled>Sélectionner une place</option>
              <option
                v-for="place in placesForBlock"
                :key="place.id"
                :value="place.id"
              >
                {{ place.code }}{{ place.name ? ` — ${place.name}` : '' }}
              </option>
            </select>
            <p v-if="form.blockId && placesForBlock.length === 0" class="mt-1 text-[10px] text-slate-400">
              Aucune place dans ce bloc.
            </p>
          </div>

          <!-- Montant -->
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Montant mensuel (FBu) *</label>
            <input
              v-model.number="form.amount"
              type="number"
              min="0"
              step="1000"
              required
              class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold focus:bg-white focus:outline-none"
            >
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Valide du *</label>
              <input
                v-model="form.effectiveFrom"
                type="date"
                required
                class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
              >
            </div>
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Valide au</label>
              <input
                v-model="form.effectiveTo"
                type="date"
                class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
              >
            </div>
          </div>

          <!-- Statut -->
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Statut</label>
            <select
              v-model="form.status"
              class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>

          <!-- Erreur -->
          <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {{ formError }}
          </p>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              @click="closeForm"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {{ isSaving ? 'Enregistrement…' : editingRate ? 'Enregistrer' : 'Créer le tarif' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal confirmation suppression -->
    <div
      v-if="deletingRate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-2 text-sm font-bold text-slate-900">Supprimer ce tarif ?</h3>
        <p class="mb-4 text-xs text-slate-500">
          Tarif de <strong>{{ money(deletingRate.amount) }}</strong>/mois pour
          {{ deletingRate.scope === 'place' ? `la place ${deletingRate.placeCode}` : `le bloc ${deletingRate.blockCode}` }}.
          Cette action est irréversible.
        </p>
        <p v-if="deleteError" class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {{ deleteError }}
        </p>
        <div class="flex justify-end gap-2">
          <button
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            @click="deletingRate = null; deleteError = ''"
          >
            Annuler
          </button>
          <button
            :disabled="isDeleting"
            class="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            @click="doDelete"
          >
            {{ isDeleting ? 'Suppression…' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { Building2, Edit, MapPin, Plus, Search, Trash2, X } from 'lucide-vue-next';
import { formatCurrency } from '../../utils/format.js';
import {
  listRentRatesApi,
  createRentRateApi,
  updateRentRateApi,
  deleteRentRateApi,
} from '../../services/marketApi.js';
import { mapRentRate } from '../../services/apiMappers.js';
import { marketStore } from '../../store/index.js';

// ─── State ──────────────────────────────────────────────────────────────────

const blocks  = computed(() => marketStore.state.blocks || []);
const places  = computed(() => marketStore.state.places || []);

const rates      = ref([]);
const isLoading  = ref(false);
const error      = ref('');
const searchQuery = ref('');
const filterScope  = ref('');
const filterStatus = ref('');

// ─── Chargement ─────────────────────────────────────────────────────────────

async function loadRates() {
  isLoading.value = true;
  error.value = '';
  try {
    const response = await listRentRatesApi({ per_page: 500 });
    rates.value = (response?.data || []).map(mapRentRate);
  } catch (err) {
    error.value = err?.message || 'Impossible de charger les tarifs.';
  } finally {
    isLoading.value = false;
  }
}

loadRates();

// ─── Filtrage ────────────────────────────────────────────────────────────────

const filtered = computed(() => {
  let list = rates.value;
  const query = searchQuery.value.trim().toLowerCase();

  if (query) {
    list = list.filter((r) =>
      [r.blockCode, r.blockName, r.placeCode].some((v) => v && v.toLowerCase().includes(query))
    );
  }
  if (filterScope.value) {
    list = list.filter((r) => r.scope === filterScope.value);
  }
  if (filterStatus.value) {
    list = list.filter((r) => r.status === filterStatus.value);
  }
  return list;
});

// ─── Places filtrées selon le bloc sélectionné ───────────────────────────────

const placesForBlock = computed(() =>
  places.value.filter((p) => form.blockId && p.blockId === form.blockId)
);

// ─── Formulaire ──────────────────────────────────────────────────────────────

const isFormOpen  = ref(false);
const editingRate = ref(null);
const isSaving    = ref(false);
const formError   = ref('');

const form = reactive({
  scope: 'block',
  blockId: null,
  placeId: null,
  amount: 0,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: '',
  status: 'ACTIVE',
});

function resetForm(rate = null) {
  editingRate.value = rate;
  form.scope         = rate?.scope || 'block';
  form.blockId       = rate?.blockId || null;
  form.placeId       = rate?.placeId || null;
  form.amount        = rate?.amount || 0;
  form.effectiveFrom = rate?.effectiveFrom || new Date().toISOString().slice(0, 10);
  form.effectiveTo   = rate?.effectiveTo || '';
  form.status        = rate?.status || 'ACTIVE';
  formError.value    = '';
}

function openCreate() {
  resetForm();
  isFormOpen.value = true;
}

// Pré-remplir le montant avec le tarif par défaut du bloc sélectionné
watch(
  () => form.blockId,
  (blockId) => {
    if (!blockId || editingRate.value) return;
    const block = blocks.value.find((b) => b.id === blockId || Number(b.id) === Number(blockId));
    if (block && block.defaultRentPrice > 0) {
      form.amount = block.defaultRentPrice;
    }
  }
);

function openEdit(rate) {
  resetForm(rate);
  isFormOpen.value = true;
}

function closeForm() {
  isFormOpen.value = false;
  editingRate.value = null;
}

async function save() {
  if (!form.blockId) {
    formError.value = 'Veuillez sélectionner un bloc.';
    return;
  }
  if (form.scope === 'place' && !form.placeId) {
    formError.value = 'Veuillez sélectionner une place.';
    return;
  }

  isSaving.value = true;
  formError.value = '';

  const payload = {
    block_id:       form.blockId,
    place_id:       form.scope === 'place' ? form.placeId : null,
    amount:         form.amount,
    effective_from: form.effectiveFrom,
    effective_to:   form.effectiveTo || null,
    status:         form.status,
  };

  try {
    if (editingRate.value) {
      await updateRentRateApi(editingRate.value.id, payload);
    } else {
      await createRentRateApi(payload);
    }
    closeForm();
    await loadRates();
  } catch (err) {
    formError.value = err?.message || 'Une erreur est survenue.';
  } finally {
    isSaving.value = false;
  }
}

// ─── Suppression ─────────────────────────────────────────────────────────────

const deletingRate = ref(null);
const isDeleting   = ref(false);
const deleteError  = ref('');

function confirmDelete(rate) {
  deletingRate.value = rate;
  deleteError.value  = '';
}

async function doDelete() {
  if (!deletingRate.value) return;
  isDeleting.value = true;
  deleteError.value = '';

  try {
    await deleteRentRateApi(deletingRate.value.id);
    deletingRate.value = null;
    await loadRates();
  } catch (err) {
    deleteError.value = err?.message || 'Impossible de supprimer ce tarif.';
  } finally {
    isDeleting.value = false;
  }
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function money(value) {
  return formatCurrency(Number(value || 0), 'FBu');
}
</script>
