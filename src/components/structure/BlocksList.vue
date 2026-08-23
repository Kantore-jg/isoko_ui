<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Blocs & Grille Tarifaire</h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Configuration des zones marchandes et fixation des tarifs de base des loyers
        </p>
      </div>

      <button
        v-if="canEdit"
        class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        <span>Nouveau Bloc</span>
      </button>
    </div>

    <DataStatePanel
      :loading="isLoading"
      :error="dataError"
      :empty="filteredBlocks.length === 0 && !isLoading && !dataError"
      title="Blocs"
      loading-message="Chargement des blocs..."
      error-message="Impossible de charger les blocs."
      empty-message="Aucun bloc ne correspond à la recherche."
    />

    <div v-if="!isLoading && !dataError && filteredBlocks.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Blocs actifs</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">{{ blockCards.length }}</p>
        <p class="mt-1 text-xs text-slate-500">Structure principale du marché</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Places totales</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">{{ totalPlaces }}</p>
        <p class="mt-1 text-xs text-slate-500">Capacité installée</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Places occupées</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">{{ occupiedPlaces }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ occupancyRate }}% d’occupation globale</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">CA attendu / mois</p>
        <p class="mt-2 text-2xl font-extrabold text-emerald-700">{{ money(monthlyExpected) }}</p>
        <p class="mt-1 text-xs text-slate-500">Loyers théoriques consolidés</p>
      </article>
    </div>

    <div class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative w-full sm:max-w-md">
          <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher bloc (code, nom, catégorie...)"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
        </div>

        <div class="text-xs font-semibold text-slate-500">
          {{ filteredBlocks.length }} / {{ blockCards.length }} blocs trouvés
        </div>
      </div>
    </div>

    <div v-if="!isLoading && !dataError && filteredBlocks.length > 0" class="grid gap-6 md:grid-cols-2">
      <article
        v-for="block in filteredBlocks"
        :key="block.id"
        class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
      >
        <div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
                {{ shortCode(block.code) }}
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">{{ block.name }}</h3>
                <span class="mt-0.5 inline-block rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {{ block.category }}
                </span>
              </div>
            </div>

            <button
              v-if="canEdit"
              class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title="Modifier le bloc"
              @click="openEdit(block)"
            >
              <Edit class="h-4 w-4" />
            </button>
          </div>

          <p class="mt-3 text-xs leading-relaxed text-slate-600">
            {{ block.description || 'Aucune description renseignée.' }}
          </p>

          <div class="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-xs">
            <div>
              <span class="block text-[10px] font-semibold uppercase text-slate-400">Tarif mensuel</span>
              <span class="font-mono text-sm font-bold text-slate-900">{{ money(block.defaultRentPrice) }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-semibold uppercase text-slate-400">Places</span>
              <span class="font-bold text-slate-900">
                {{ block.occupiedCount }} / {{ block.totalPlaces }} ({{ block.occupancyRate }}%)
              </span>
            </div>
            <div>
              <span class="block text-[10px] font-semibold uppercase text-slate-400">CA attendu / mois</span>
              <span class="font-mono font-bold text-emerald-700">{{ money(block.expectedRevenue) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 border-t border-slate-100 pt-3">
          <div class="h-2 overflow-hidden rounded-full bg-slate-100">
            <div class="h-2 rounded-full bg-emerald-500 transition-all duration-300" :style="{ width: `${block.occupancyRate}%` }" />
          </div>
        </div>
      </article>
    </div>

    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">
          {{ editingBlock ? 'Modifier le Bloc' : 'Créer un Nouveau Bloc' }}
        </h3>

        <form class="space-y-4 text-xs" @submit.prevent="save">
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Code du Bloc *</span>
              <input v-model="form.code" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Catégorie *</span>
              <input v-model="form.category" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Nom complet du Bloc *</label>
            <input v-model="form.name" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Loyer mensuel standard (FBu) *</label>
            <input v-model.number="form.defaultRentPrice" type="number" min="1000" step="1000" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold focus:bg-white focus:outline-none" required>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Description / Emplacement</label>
            <textarea v-model="form.description" rows="3" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="close">
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              {{ editingBlock ? 'Enregistrer les modifications' : 'Créer le bloc' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { Edit, Plus, Search } from 'lucide-vue-next';
import DataStatePanel from '../common/DataStatePanel.vue';
import { formatCurrency } from '../../utils/format.js';
import { marketStore } from '../../store/index.js';

const blocks = computed(() => marketStore.state.blocks || []);
const places = computed(() => marketStore.state.places || []);
const currentUser = computed(() => marketStore.state.currentUser || { role: 'SUPER_ADMIN' });
const isLoading = computed(() => marketStore.state.isLoadingData);
const dataError = computed(() => marketStore.state.dataError || '');
const searchQuery = ref('');
const isOpen = ref(false);
const editingBlock = ref(null);

const form = reactive({
  code: '',
  name: '',
  category: '',
  defaultRentPrice: 0,
  description: '',
});

const canEdit = computed(() => currentUser.value.role !== 'ACCOUNTANT');

const blockCards = computed(() =>
  blocks.value.map((block) => {
    const blockPlaces = places.value.filter((place) => place && (place.blockId === block.id || place.blockCode === block.code));
    const occupiedCount = blockPlaces.filter((place) => place.status === 'OCCUPIED').length;
    const totalPlaces = blockPlaces.length || Number(block.totalPlaces || 0);

    return {
      ...block,
      totalPlaces,
      occupiedCount,
      occupancyRate: totalPlaces > 0 ? Math.round((occupiedCount / totalPlaces) * 100) : 0,
      expectedRevenue: blockPlaces
        .filter((place) => place.status === 'OCCUPIED')
        .reduce((sum, place) => sum + Number(place.rentPrice || 0), 0),
    };
  })
);

const filteredBlocks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return blockCards.value;
  return blockCards.value.filter((block) =>
    [block.code, block.name, block.category, block.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
});

const totalPlaces = computed(() => places.value.length);
const occupiedPlaces = computed(() => places.value.filter((place) => place.status === 'OCCUPIED').length);
const occupancyRate = computed(() => (totalPlaces.value > 0 ? Math.round((occupiedPlaces.value / totalPlaces.value) * 100) : 0));
const monthlyExpected = computed(() => blockCards.value.reduce((sum, block) => sum + Number(block.expectedRevenue || 0), 0));

function money(value) {
  return formatCurrency(Number(value || 0), 'FBu');
}

function shortCode(code = '') {
  return String(code).replace(/^Bloc\s*/i, '').trim().slice(0, 2) || 'B';
}

function resetForm(block = null) {
  editingBlock.value = block;
  form.code = block?.code || `Bloc ${String.fromCharCode(65 + blocks.value.length)}`;
  form.name = block?.name || `${form.code} - `;
  form.category = block?.category || 'Divers';
  form.defaultRentPrice = block?.defaultRentPrice || 60000;
  form.description = block?.description || '';
}

function openCreate() {
  resetForm();
  isOpen.value = true;
}

function openEdit(block) {
  resetForm(block);
  isOpen.value = true;
}

async function save() {
  const payload = {
    code: form.code.trim(),
    name: `${form.code.trim()} - ${form.category.trim()}`,
    category: form.category.trim(),
    defaultRentPrice: Number(form.defaultRentPrice) || 0,
    description: form.description.trim(),
  };

  if (editingBlock.value) {
    await marketStore.updateBlock(editingBlock.value.id, payload);
  } else {
    await marketStore.addBlock(payload);
  }

  close();
}

function close() {
  isOpen.value = false;
  editingBlock.value = null;
}
</script>
