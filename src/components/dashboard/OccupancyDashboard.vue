<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <Grid class="h-5 w-5 text-emerald-600" />
            <h2 class="text-base font-bold text-slate-900">Plan 2D & Visualisation d'Occupation</h2>
          </div>
          <p class="mt-1 max-w-2xl text-xs text-slate-500">
            Représentation visuelle des emplacements par bloc. Cliquez sur une place pour inspecter son occupant et son historique.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div class="relative w-full sm:w-72">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher place, commerçant..."
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pl-9 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
            <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <button
              class="rounded-lg px-3 py-1.5 font-medium transition-colors"
              :class="activeBlockFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              @click="activeBlockFilter = 'ALL'"
            >
              Tous les Blocs
            </button>
            <button
              v-for="block in blocks"
              :key="block.id"
              class="rounded-lg px-3 py-1.5 font-medium transition-colors"
              :class="activeBlockFilter === block.id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              @click="activeBlockFilter = block.id"
            >
              {{ block.code }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-600">
      <div class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-sm bg-emerald-500" />
        <span>Occupé (À jour)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-sm bg-amber-500" />
        <span>Occupé (Loyer en retard)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-sm bg-sky-400" />
        <span>Disponible (Libre)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-sm bg-slate-300" />
        <span>En Maintenance</span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div class="space-y-6 xl:col-span-2">
        <div
          v-for="block in filteredBlocks"
          :key="block.id"
          class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
        >
          <div class="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                <span>{{ block.name }}</span>
                <span class="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                  {{ money(block.defaultRentPrice) }}/mois
                </span>
              </h3>
              <p class="text-xs text-slate-500">{{ block.description }}</p>
            </div>
            <span class="text-xs font-semibold text-slate-600">
              {{ visiblePlacesByBlock(block).length }} / {{ block.totalPlaces }} affichées ({{ block.totalPlaces }} total)
            </span>
          </div>

          <div class="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
            <button
              v-for="place in visiblePlacesByBlock(block)"
              :key="place.id"
              class="flex h-24 flex-col justify-between rounded-xl border p-3 text-left transition-all duration-150"
              :class="[tileClasses(place), selectedPlaceId === place.id ? 'scale-[1.02] ring-2 ring-emerald-500 ring-offset-2' : '']"
              @click="selectPlace(place)"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-extrabold tracking-tight text-slate-900">{{ place.code }}</span>
                <span class="h-2 w-2 rounded-full" :class="badgeColor(place)" />
              </div>

              <div>
                <p v-if="place.status === 'OCCUPIED'" class="truncate text-[10px] font-semibold leading-tight text-slate-800">
                  {{ place.currentMerchantName }}
                </p>
                <p v-else class="text-[10px] font-bold uppercase text-slate-400">
                  {{ place.status === 'AVAILABLE' ? 'Libre' : 'Travaux' }}
                </p>
                <p class="mt-0.5 font-mono text-[9px] text-slate-500">
                  {{ money(place.rentPrice) }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <div v-if="filteredBlocks.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Aucun bloc ne correspond au filtre actif.
        </div>
      </div>

      <div class="sticky top-20 h-fit rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div v-if="selectedPlace" class="space-y-5">
          <div class="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl font-extrabold text-slate-900">{{ selectedPlace.code }}</span>
                <span class="rounded-full px-2 py-0.5 text-xs font-bold" :class="statusPillClass(selectedPlace)">
                  {{ statusLabel(selectedPlace) }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ selectedPlace.blockCode }} • {{ selectedPlace.category }} ({{ selectedPlace.surface }} m²)
              </p>
            </div>

            <div class="text-right">
              <span class="font-mono text-sm font-bold text-slate-900">{{ money(selectedPlace.rentPrice) }}</span>
              <p class="text-[10px] text-slate-400">loyer mensuel</p>
            </div>
          </div>

          <div v-if="selectedPlace.status === 'OCCUPIED'" class="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Occupant actuel</p>
            <div class="flex items-center gap-2">
              <User class="h-4 w-4 text-emerald-600" />
              <p class="text-sm font-bold text-slate-900">{{ selectedPlace.currentMerchantName }}</p>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-600">
              <div>
                <span class="block text-[10px] text-slate-400">Depuis le :</span>
                <span class="font-medium">{{ currentAssignment?.startDate || '2026-01-01' }}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400">Loyer actuel :</span>
                <span class="font-mono font-bold text-emerald-700">{{ money(selectedPlace.rentPrice) }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="selectedPlace.status === 'AVAILABLE'" class="rounded-xl border border-sky-100 bg-sky-50 p-4 text-center">
            <p class="text-xs font-bold text-sky-900">Emplacement Libre</p>
            <p class="mt-0.5 text-[11px] text-sky-700">
              Cette place peut être affectée immédiatement à un nouveau commerçant.
            </p>
            <button
              v-if="currentUser.role !== 'SUPER_ADMIN'"
              class="mt-3 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              @click="openAssign(selectedPlace)"
            >
              Affecter un commerçant
            </button>
          </div>

          <div v-else class="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
            <p class="text-xs font-bold text-slate-900">Emplacement en Maintenance</p>
            <p class="mt-0.5 text-[11px] text-slate-600">La place est temporairement indisponible.</p>
          </div>

          <div v-if="currentUser.role !== 'SUPER_ADMIN' && selectedPlace.status === 'OCCUPIED'" class="grid grid-cols-3 gap-2">
            <button
              class="flex flex-col items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center text-[11px] font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
              @click="marketStore.setIsNewPaymentModalOpen(true)"
            >
              <CreditCard class="h-3.5 w-3.5" />
              <span>Encaisser</span>
            </button>
            <button
              class="flex flex-col items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 p-2 text-center text-[11px] font-bold text-teal-800 transition-colors hover:bg-teal-100"
              @click="openTransfer(selectedPlace)"
            >
              <Repeat class="h-3.5 w-3.5" />
              <span>Mutation</span>
            </button>
            <button
              class="flex flex-col items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 p-2 text-center text-[11px] font-bold text-rose-800 transition-colors hover:bg-rose-100"
              @click="openTerminate(selectedPlace)"
            >
              <LogOut class="h-3.5 w-3.5" />
              <span>Libérer</span>
            </button>
          </div>

          <div v-if="selectedPlace.status === 'OCCUPIED'">
            <p class="mb-2 text-xs font-bold text-slate-800">Suivi des Loyers 2026</p>
            <div class="grid grid-cols-4 gap-1.5 text-[11px]">
              <div
                v-for="entry in selectedPlaceTimeline"
                :key="entry.month"
                class="rounded border p-1.5 text-center font-mono font-semibold"
                :class="entry.className"
                :title="entry.title"
              >
                <p class="text-[10px] uppercase">{{ entry.shortLabel }}</p>
                <p class="text-[9px]">{{ entry.label }}</p>
              </div>
            </div>
          </div>

          <div>
            <p class="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <History class="h-3.5 w-3.5 text-slate-500" />
              <span>Historique des Occupants & Mouvements</span>
            </p>
            <div class="max-h-56 space-y-2 overflow-y-auto pr-1">
              <p v-if="selectedPlaceAssignments.length === 0" class="py-4 text-[11px] italic text-slate-400">
                Aucun historique d'affectation.
              </p>
              <div
                v-for="assignment in selectedPlaceAssignments"
                :key="assignment.id"
                class="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="font-bold text-slate-800">{{ assignment.merchantName }}</span>
                  <span
                    class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    :class="assignment.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'"
                  >
                    {{ assignment.status === 'ACTIVE' ? 'Actuel' : 'Ancien' }}
                  </span>
                </div>
                <p class="mt-0.5 font-mono text-[11px] text-slate-500">
                  {{ assignment.startDate }} → {{ assignment.endDate || 'Aujourd’hui' }}
                </p>
                <p class="mt-0.5 font-mono text-[10px] text-slate-600">
                  Loyer fixé: {{ money(assignment.rentAmount) }}
                </p>
                <p v-if="assignment.notes" class="mt-1 text-[10px] italic text-slate-500">
                  {{ assignment.notes }}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p class="mb-2 text-xs font-bold text-slate-800">Historique des Mouvements</p>
            <div class="max-h-44 space-y-2 overflow-y-auto pr-1">
              <p v-if="selectedPlaceMovements.length === 0" class="py-3 text-[11px] italic text-slate-400">
                Aucun mouvement enregistré.
              </p>
              <div
                v-for="movement in selectedPlaceMovements"
                :key="movement.id"
                class="rounded-lg border border-slate-200 bg-white p-2.5 text-xs"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="font-semibold text-slate-900">{{ movement.typeLabel }}</span>
                  <span class="font-mono text-[11px] text-slate-500">{{ movement.date }}</span>
                </div>
                <p class="mt-0.5 text-[11px] text-slate-600">{{ movement.reason }}</p>
              </div>
            </div>
          </div>
        </div>

        <p v-else class="py-10 text-center text-xs text-slate-400">Sélectionnez une place sur le plan.</p>
      </div>
    </div>

    <div v-if="assignTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Affecter {{ assignTarget.code }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ assignTarget.blockCode }} • {{ money(assignTarget.rentPrice) }}</p>
          </div>
          <button class="text-sm font-bold text-slate-400 hover:text-slate-700" @click="closeModals">X</button>
        </div>

        <form class="space-y-4 text-xs" @submit.prevent="submitAssign">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Commerçant *</span>
            <select v-model="assignForm.merchantId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
              <option v-for="merchant in activeMerchants" :key="merchant.id" :value="merchant.id">
                {{ merchant.name }}
              </option>
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
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="closeModals">
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              Affecter
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="transferTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Muter {{ transferTarget.code }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ transferTarget.blockCode }} • {{ money(transferTarget.rentPrice) }}</p>
          </div>
          <button class="text-sm font-bold text-slate-400 hover:text-slate-700" @click="closeModals">X</button>
        </div>

        <form class="space-y-4 text-xs" @submit.prevent="submitTransfer">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Nouveau emplacement *</span>
            <select v-model="transferForm.toPlaceId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
              <option v-for="place in availableTransferTargets" :key="place.id" :value="place.id">
                {{ place.code }} ({{ place.blockCode }})
              </option>
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
            <textarea v-model="transferForm.reason" rows="3" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
          </label>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="closeModals">
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700">
              Muter
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="terminateTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Libérer {{ terminateTarget.code }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ terminateTarget.blockCode }} • {{ money(terminateTarget.rentPrice) }}</p>
          </div>
          <button class="text-sm font-bold text-slate-400 hover:text-slate-700" @click="closeModals">X</button>
        </div>

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
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="closeModals">
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700">
              Libérer
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { CreditCard, Grid, History, LogOut, Repeat, Search, User } from 'lucide-vue-next';
import { marketStore } from '../../store/index.js';

const router = useRouter();
const currentUser = computed(() => marketStore.state.currentUser || { role: 'SUPER_ADMIN' });
const places = computed(() => marketStore.state.places || []);
const obligations = computed(() => marketStore.state.obligations || []);
const assignments = computed(() => marketStore.state.assignments || []);
const movements = computed(() => marketStore.state.movements || []);
const activeMerchants = computed(() => (marketStore.state.merchants || []).filter((merchant) => merchant.status === 'ACTIVE' && merchant.id));
const blockStats = computed(() =>
  (marketStore.blockStats?.value || [])
    .filter((block) => block && (block.id || block.code))
    .map((block, index) => ({
      id: block.id || block.code || `block-${index}`,
      code: block.code || `Bloc ${index + 1}`,
      name: block.name || block.code || `Bloc ${index + 1}`,
      description: block.description || '',
      category: block.category || '',
      defaultRentPrice: Number(block.defaultRentPrice ?? block.defaultPrice ?? 0),
      totalPlaces: Number(block.totalPlaces ?? 0),
    }))
);

const activeBlockFilter = ref('ALL');
const searchQuery = ref('');
const selectedPlaceId = ref(null);
const assignTarget = ref(null);
const transferTarget = ref(null);
const terminateTarget = ref(null);

const assignForm = reactive({
  merchantId: '',
  startDate: todayIso(),
  rentAmount: 0,
  notes: '',
});

const transferForm = reactive({
  toPlaceId: '',
  date: todayIso(),
  rentAmount: 0,
  reason: '',
});

const terminateForm = reactive({
  endDate: todayIso(),
  reason: 'Départ / Fin de contrat',
});

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FBu`;
}

const filteredBlocks = computed(() =>
  activeBlockFilter.value === 'ALL'
    ? blockStats.value
    : blockStats.value.filter((block) => block.id === activeBlockFilter.value || block.code === activeBlockFilter.value)
);

function visiblePlacesByBlock(block) {
  return places.value.filter((place) => {
    if (!place) return false;
    const belongsToBlock = place.blockId === block.id || place.blockCode === block.code;
    if (!belongsToBlock) return false;
    if (!searchQuery.value.trim()) return true;
    const q = searchQuery.value.trim().toLowerCase();
    return [place.code, place.currentMerchantName, place.blockCode, place.category, place.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });
}

const selectedPlace = computed(() => places.value.find((place) => place.id === selectedPlaceId.value) || null);

const currentAssignment = computed(() => {
  if (!selectedPlace.value) return null;
  return assignments.value.find((assignment) => assignment.placeId === selectedPlace.value.id && assignment.status === 'ACTIVE') || null;
});

const selectedPlaceAssignments = computed(() => {
  if (!selectedPlace.value) return [];
  return assignments.value
    .filter((assignment) => assignment.placeId === selectedPlace.value.id)
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
});

const selectedPlaceMovements = computed(() => {
  if (!selectedPlace.value) return [];
  return movements.value.filter((movement) => movement.placeId === selectedPlace.value.id);
});

const selectedPlaceObligations = computed(() => {
  if (!selectedPlace.value) return [];
  return obligations.value
    .filter((obligation) => obligation.placeId === selectedPlace.value.id)
    .slice()
    .sort((a, b) => (a.periodMonth || 0) - (b.periodMonth || 0));
});

const selectedPlaceTimeline = computed(() => {
  const byMonth = new Map(selectedPlaceObligations.value.map((obligation) => [obligation.periodMonth, obligation]));
  const monthShortLabels = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUI', 'AOÛ'];
  return Array.from({ length: 8 }, (_, index) => {
    const month = index + 1;
    const obligation = byMonth.get(month);
    const status = obligation?.status || 'PENDING';
    return {
      month,
      shortLabel: monthShortLabels[index],
      label: status === 'PAID' ? '✓ Payé' : status === 'OVERDUE' ? '✕ Dû' : 'Attente',
      title: obligation ? `${obligation.periodLabel}: ${obligation.status}` : `Mois ${month}: aucun reçu`,
      className:
        status === 'PAID'
          ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
          : status === 'OVERDUE'
            ? 'border-rose-200 bg-rose-100 text-rose-800'
            : 'border-slate-200 bg-slate-100 text-slate-700',
    };
  });
});

const availableTransferTargets = computed(() =>
  places.value.filter(
    (place) => place && place.status === 'AVAILABLE' && (!transferTarget.value || place.id !== transferTarget.value.id)
  )
);

watch(
  () => places.value,
  (list) => {
    if (!list.length) {
      selectedPlaceId.value = null;
      return;
    }
    if (!selectedPlaceId.value || !list.some((place) => place.id === selectedPlaceId.value)) {
      selectedPlaceId.value = list[0].id;
    }
  },
  { immediate: true, deep: true }
);

function selectPlace(place) {
  selectedPlaceId.value = place.id;
}

function tileClasses(place) {
  const overdue = place.status === 'OCCUPIED' && obligations.value.some((obligation) => obligation.placeId === place.id && obligation.status === 'OVERDUE');
  if (place.status === 'OCCUPIED') {
    return overdue
      ? 'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
      : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100';
  }
  if (place.status === 'MAINTENANCE') {
    return 'border-slate-300 bg-slate-100 text-slate-700 opacity-70';
  }
  return 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100';
}

function badgeColor(place) {
  const overdue = place.status === 'OCCUPIED' && obligations.value.some((obligation) => obligation.placeId === place.id && obligation.status === 'OVERDUE');
  if (place.status === 'OCCUPIED') return overdue ? 'bg-amber-500' : 'bg-emerald-600';
  if (place.status === 'MAINTENANCE') return 'bg-slate-400';
  return 'bg-sky-500';
}

function statusLabel(place) {
  if (place.status === 'OCCUPIED') return 'Occupée';
  if (place.status === 'AVAILABLE') return 'Disponible';
  return 'Maintenance';
}

function statusPillClass(place) {
  if (place.status === 'OCCUPIED') {
    const overdue = obligations.value.some((obligation) => obligation.placeId === place.id && obligation.status === 'OVERDUE');
    return overdue ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
  }
  if (place.status === 'AVAILABLE') return 'bg-sky-100 text-sky-800';
  return 'bg-slate-200 text-slate-700';
}

function openAssign(place) {
  assignTarget.value = place;
  assignForm.merchantId = activeMerchants.value[0]?.id || '';
  assignForm.startDate = todayIso();
  assignForm.rentAmount = Number(place.rentPrice || 0);
  assignForm.notes = '';
}

function openTransfer(place) {
  transferTarget.value = place;
  transferForm.toPlaceId = availableTransferTargets.value[0]?.id || '';
  transferForm.date = todayIso();
  transferForm.rentAmount = Number(availableTransferTargets.value[0]?.rentPrice || place.rentPrice || 0);
  transferForm.reason = '';
}

function openTerminate(place) {
  terminateTarget.value = place;
  terminateForm.endDate = todayIso();
  terminateForm.reason = 'Départ / Fin de contrat';
}

function closeModals() {
  assignTarget.value = null;
  transferTarget.value = null;
  terminateTarget.value = null;
}

async function submitAssign() {
  if (!assignTarget.value || !assignForm.merchantId) return;
  await marketStore.assignPlace(assignTarget.value.id, assignForm.merchantId, assignForm.startDate, assignForm.rentAmount, assignForm.notes);
  selectedPlaceId.value = assignTarget.value.id;
  closeModals();
}

async function submitTransfer() {
  if (!transferTarget.value || !transferForm.toPlaceId || !selectedPlace.value?.currentMerchantId) return;
  await marketStore.transferPlace(
    selectedPlace.value.currentMerchantId,
    transferTarget.value.id,
    transferForm.toPlaceId,
    transferForm.date,
    transferForm.reason,
    transferForm.rentAmount
  );
  selectedPlaceId.value = transferForm.toPlaceId;
  closeModals();
}

async function submitTerminate() {
  const assignment = currentAssignment.value;
  if (!terminateTarget.value || !assignment) return;
  await marketStore.terminateAssignment(assignment.id, terminateForm.endDate, terminateForm.reason);
  closeModals();
}
</script>
