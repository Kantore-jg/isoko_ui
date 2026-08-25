<template>
  <section class="space-y-6">
    <DataStatePanel
      :loading="isLoading"
      :error="dataError"
      :empty="!isLoading && !dataError && !blockStats.length"
      title="Synthèse opérationnelle"
      loading-message="Chargement des données de supervision..."
      error-message="Impossible de charger les indicateurs d’exploitation."
      empty-message="Les blocs et places ne sont pas encore disponibles."
    />


        <div class="flex flex-wrap items-center gap-2">
          <button
            class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            @click="navigate('/structure/places')"
          >
            <MapPin class="h-3.5 w-3.5" />
            <span>Gérer les Places</span>
          </button>
          <button
            class="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            @click="navigate('/merchants')"
          >
            <Users class="h-3.5 w-3.5" />
            <span>Commerçants</span>
          </button>
        </div>


    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Total des Places</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ places.length }} Places</p>
            <p class="mt-1 text-xs text-slate-500">4 Blocs de vente actifs</p>
          </div>
          <Building class="h-5 w-5 text-slate-500" />
        </div>
        <button class="mt-4 rounded bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700" @click="navigate('/structure/places')">
          Capacité totale
        </button>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Places Occupées</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ occupiedPlaces.length }} Places</p>
            <p class="mt-1 text-xs text-slate-500">{{ occupancyRate }}% d'occupation</p>
          </div>
          <CheckCircle2 class="h-5 w-5 text-emerald-600" />
        </div>
        <button class="mt-4 rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700" @click="navigate('/merchants/assignments')">
          En exploitation
        </button>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Places Libres</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ availablePlaces.length }} Libres</p>
            <p class="mt-1 text-xs text-slate-500">Prêtes pour affectation</p>
          </div>
          <Plus class="h-5 w-5 text-blue-600" />
        </div>
        <button class="mt-4 rounded bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700" @click="navigate('/structure/places')">
          Attribution immédiate
        </button>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Places en Maintenance</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ maintenancePlaces.length }} Places</p>
            <p class="mt-1 text-xs text-slate-500">Travaux et rénovations</p>
          </div>
          <AlertTriangle class="h-5 w-5 text-amber-600" />
        </div>
        <button class="mt-4 rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
          Indisponibles
        </button>
      </article>
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
      <div class="xl:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">État des Blocs & Disponibilités</h3>
          <button class="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline" @click="navigate('/structure/blocks')">
            <span>Voir la configuration des blocs</span>
            <ArrowRight class="h-3.5 w-3.5" />
          </button>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <article v-for="(block, index) in blockStats" :key="block?.id || block?.code || `block-${index}`" class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300">
            <div>
              <div class="mb-2 flex items-start justify-between">
                <div>
                  <h4 class="text-sm font-bold text-slate-900">{{ block.code }}</h4>
                  <p class="text-xs text-slate-500">{{ block.category }}</p>
                </div>
                <span class="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
                  {{ (block.defaultRentPrice ?? block.defaultPrice ?? 0).toLocaleString() }} FBu
                </span>
              </div>

              <div class="mt-3 space-y-1.5">
                <div class="flex justify-between text-xs font-medium text-slate-600">
                  <span>Occupation</span>
                  <span class="font-bold text-slate-900">{{ block.occupiedPlaces }} / {{ block.totalPlaces }} ({{ block.occupancyRate }}%)</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div class="h-2 rounded-full bg-emerald-500" :style="{ width: `${block.occupancyRate}%` }" />
                </div>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span class="font-medium text-slate-500">
                {{ block.availablePlaces }} {{ block.availablePlaces > 1 ? 'places libres' : 'place libre' }}
              </span>
              <button class="font-bold text-emerald-700 hover:underline" @click="navigate('/dashboard/occupancy')">
                Voir plan 2D →
              </button>
            </div>
          </article>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-bold text-slate-900">Places Libres à Affecter</h3>
          <span class="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{{ availablePlaces.length }} disponibles</span>
        </div>

        <div class="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          <p v-if="availablePlaces.length === 0" class="p-4 text-center text-xs text-slate-400">Toutes les places sont occupées.</p>
          <div v-for="place in availablePlaces" :key="place.id" class="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
            <div>
              <span class="font-bold text-slate-900">{{ place.code }}</span>
              <p class="text-[11px] text-slate-500">{{ place.blockCode }} • {{ place.rentPrice.toLocaleString() }} FBu</p>
            </div>
            <button class="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-700" @click="openAssign(place)">
              Affecter
            </button>
          </div>
        </div>

        <button class="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100" @click="navigate('/merchants/assignments')">
          Voir toutes les affectations actives
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2">
          <Repeat class="h-5 w-5 text-emerald-600" />
          <div>
            <h3 class="text-sm font-bold text-slate-900">Historique des Mouvements (Circulation)</h3>
            <p class="text-xs text-slate-500">Traçabilité complète des attributions et libérations</p>
          </div>
        </div>
        <button class="text-xs font-semibold text-emerald-600 hover:underline" @click="navigate('/merchants/movements')">
          Consulter tous les mouvements →
        </button>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-3 py-2.5">Date</th>
              <th class="px-3 py-2.5">Place</th>
              <th class="px-3 py-2.5">Type de Mouvement</th>
              <th class="px-3 py-2.5">Commerçant</th>
              <th class="px-3 py-2.5">Motif</th>
              <th class="px-3 py-2.5">Opérateur</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="movement in movements.slice(0, 5)" :key="movement.id" class="hover:bg-slate-50/80">
              <td class="px-3 py-3 font-mono text-slate-500">{{ movement.date }}</td>
              <td class="px-3 py-3 font-bold text-slate-900">{{ movement.placeCode }}</td>
              <td class="px-3 py-3">
                <span class="rounded px-2 py-0.5 text-[10px] font-bold"
                  :class="movement.type === 'ENTRY' ? 'bg-emerald-100 text-emerald-800' : movement.type === 'EXIT' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'">
                  {{ movement.typeLabel }}
                </span>
              </td>
              <td class="px-3 py-3 font-medium text-slate-800">{{ movement.newMerchantName || movement.oldMerchantName || '—' }}</td>
              <td class="px-3 py-3 italic text-slate-600">{{ movement.reason }}</td>
              <td class="px-3 py-3 text-slate-500">{{ movement.executedBy }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="selectedPlace" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Affecter {{ selectedPlace.code }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ selectedPlace.blockCode }} • {{ selectedPlace.rentPrice.toLocaleString() }} FBu</p>
          </div>
          <button class="text-sm font-bold text-slate-400 hover:text-slate-700" @click="selectedPlace = null">X</button>
        </div>

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
            <textarea v-model="assignForm.notes" rows="3" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
          </label>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="selectedPlace = null">Annuler</button>
            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">Affecter</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AlertTriangle, ArrowRight, Building, CheckCircle2, MapPin, Plus, Repeat, Users } from 'lucide-vue-next';
import DataStatePanel from '../common/DataStatePanel.vue';
import { marketStore } from '../../store/index.js';

const router = useRouter();
const market = computed(() => marketStore.state.market || {});
const isLoading = computed(() => marketStore.state.isLoadingData);
const dataError = computed(() => marketStore.state.dataError || '');
const places = computed(() => marketStore.state.places);
const movements = computed(() => marketStore.state.movements);
const blockStats = computed(() =>
  (marketStore.blockStats || [])
    .filter((block) => block && (block.id || block.code))
    .map((block, index) => ({
      id: block.id || block.code || `block-${index}`,
      code: block.code || `Bloc ${index + 1}`,
      category: block.category || '',
      defaultRentPrice: Number(block.defaultRentPrice ?? block.defaultPrice ?? 0),
      occupiedPlaces: Number(block.occupiedPlaces ?? 0),
      totalPlaces: Number(block.totalPlaces ?? 0),
      occupancyRate: Number(block.occupancyRate ?? 0),
      availablePlaces: Number(block.availablePlaces ?? 0),
    }))
);
const availablePlaces = computed(() => places.value.filter((place) => place.status === 'AVAILABLE'));
const occupiedPlaces = computed(() => places.value.filter((place) => place.status === 'OCCUPIED'));
const maintenancePlaces = computed(() => places.value.filter((place) => place.status === 'MAINTENANCE'));
const occupancyRate = computed(() => (places.value.length > 0 ? Math.round((occupiedPlaces.value.length / places.value.length) * 100) : 0));
const activeMerchants = computed(() => marketStore.state.merchants.filter((merchant) => merchant.status === 'ACTIVE'));

const selectedPlace = ref(null);
const assignForm = reactive({
  merchantId: '',
  startDate: '2026-08-23',
  rentAmount: 0,
  notes: '',
});

function navigate(path) {
  router.push(path);
}

function openAssign(place) {
  selectedPlace.value = place;
  assignForm.merchantId = activeMerchants.value[0]?.id || '';
  assignForm.startDate = '2026-08-23';
  assignForm.rentAmount = place.rentPrice;
  assignForm.notes = '';
}

async function submitAssign() {
  if (!selectedPlace.value || !assignForm.merchantId) return;
  await marketStore.assignPlace(selectedPlace.value.id, assignForm.merchantId, assignForm.startDate, assignForm.rentAmount, assignForm.notes);
  selectedPlace.value = null;
}
</script>
