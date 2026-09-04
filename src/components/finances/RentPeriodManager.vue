<template>
  <section class="space-y-4">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Périodes de loyer</h2>
        <p class="mt-0.5 text-xs text-slate-500">Créez une période mensuelle puis générez les obligations pour chaque commerçant actif</p>
      </div>
      <button
        class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="openCreate"
      >
        Nouvelle période
      </button>
    </div>

    <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
      Chargement des périodes…
    </div>

    <div v-else-if="periods.length === 0" class="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800">
      <p class="font-semibold">Aucune période de loyer créée.</p>
      <p class="mt-1">Créez une période (ex : Septembre 2026) puis générez les obligations pour pouvoir enregistrer des paiements.</p>
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <table class="w-full text-left text-xs">
        <thead class="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th class="px-4 py-3">Période</th>
            <th class="px-4 py-3">Début</th>
            <th class="px-4 py-3">Fin</th>
            <th class="px-4 py-3">Échéance</th>
            <th class="px-4 py-3">Statut</th>
            <th class="px-4 py-3 text-center">Obligations</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="period in periods" :key="period.id" class="hover:bg-slate-50/80">
            <td class="px-4 py-3 font-bold text-slate-900">{{ monthName(period.month) }} {{ period.year }}</td>
            <td class="px-4 py-3 font-mono text-slate-600">{{ period.period_start }}</td>
            <td class="px-4 py-3 font-mono text-slate-600">{{ period.period_end }}</td>
            <td class="px-4 py-3 font-mono text-slate-600">{{ period.due_date }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                :class="period.status === 'OPEN' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-600'">
                {{ period.status === 'OPEN' ? 'Ouverte' : 'Clôturée' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center font-bold text-slate-700">{{ period.obligations_count ?? '—' }}</td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <button
                  class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                  :disabled="isGenerating === period.id"
                  @click="generate(period)"
                >
                  {{ isGenerating === period.id ? 'Génération…' : 'Générer obligations' }}
                </button>
                <button
                  class="text-xs font-semibold text-rose-600 hover:underline"
                  @click="deletePeriod(period)"
                >
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Message de succès -->
    <div v-if="successMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
      {{ successMessage }}
    </div>

    <!-- Modal création période -->
    <div v-if="isFormOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">Créer une période de loyer</h3>
        <form class="space-y-4 text-xs" @submit.prevent="savePeriod">
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Mois *</span>
              <select v-model.number="periodForm.month" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
                <option v-for="m in monthsList" :key="m.num" :value="m.num">{{ m.name }}</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Année *</span>
              <input v-model.number="periodForm.year" type="number" min="2020" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Début *</span>
              <input v-model="periodForm.period_start" type="date" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Fin *</span>
              <input v-model="periodForm.period_end" type="date" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
          </div>

          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Date d'échéance *</span>
            <input v-model="periodForm.due_date" type="date" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            <p class="mt-1 text-[10px] text-slate-400">Les paiements avant cette date seront marqués « en avance ».</p>
          </label>

          <p v-if="formError" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {{ formError }}
          </p>

          <div class="flex items-center gap-2 pt-1">
            <input id="autoGenerate" v-model="periodForm.autoGenerate" type="checkbox" class="accent-emerald-600">
            <label for="autoGenerate" class="text-xs font-medium text-slate-700">Générer les obligations automatiquement après création</label>
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="isFormOpen = false">Annuler</button>
            <button type="submit" :disabled="isSaving" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {{ isSaving ? 'Création…' : 'Créer la période' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import {
  listRentPeriodsApi,
  createRentPeriodApi,
  deleteRentPeriodApi,
  generateObligationsApi,
} from '../../services/marketApi.js';
import { marketStore } from '../../store/index.js';

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;

const monthsList = [
  { num: 1, name: 'Janvier' },
  { num: 2, name: 'Février' },
  { num: 3, name: 'Mars' },
  { num: 4, name: 'Avril' },
  { num: 5, name: 'Mai' },
  { num: 6, name: 'Juin' },
  { num: 7, name: 'Juillet' },
  { num: 8, name: 'Août' },
  { num: 9, name: 'Septembre' },
  { num: 10, name: 'Octobre' },
  { num: 11, name: 'Novembre' },
  { num: 12, name: 'Décembre' },
];

function monthName(num) {
  return monthsList.find((m) => m.num === num)?.name || `Mois ${num}`;
}

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function toIso(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const periods = ref([]);
const isLoading = ref(false);
const isFormOpen = ref(false);
const isSaving = ref(false);
const isGenerating = ref(null);
const formError = ref('');
const successMessage = ref('');

const periodForm = reactive({
  year: currentYear,
  month: currentMonth,
  period_start: toIso(currentYear, currentMonth, 1),
  period_end: toIso(currentYear, currentMonth, lastDayOfMonth(currentYear, currentMonth)),
  due_date: toIso(currentYear, currentMonth, lastDayOfMonth(currentYear, currentMonth)),
  autoGenerate: true,
});

function syncDates() {
  const y = periodForm.year;
  const m = periodForm.month;
  const lastDay = lastDayOfMonth(y, m);
  periodForm.period_start = toIso(y, m, 1);
  periodForm.period_end = toIso(y, m, lastDay);
  periodForm.due_date = toIso(y, m, lastDay);
}

function openCreate() {
  periodForm.year = currentYear;
  periodForm.month = currentMonth;
  periodForm.autoGenerate = true;
  syncDates();
  formError.value = '';
  successMessage.value = '';
  isFormOpen.value = true;
}

async function loadPeriods() {
  isLoading.value = true;
  try {
    const response = await listRentPeriodsApi({ per_page: 100 });
    const data = response?.data || response || [];
    periods.value = Array.isArray(data) ? data : [];
  } catch {
    periods.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function savePeriod() {
  isSaving.value = true;
  formError.value = '';
  successMessage.value = '';

  syncDates();

  try {
    const response = await createRentPeriodApi({
      year: periodForm.year,
      month: periodForm.month,
      period_start: periodForm.period_start,
      period_end: periodForm.period_end,
      due_date: periodForm.due_date,
      status: 'OPEN',
    });

    const newPeriod = response?.data || response;

    if (periodForm.autoGenerate && newPeriod?.id) {
      const genResponse = await generateObligationsApi(newPeriod.id);
      successMessage.value = `Période ${monthName(periodForm.month)} ${periodForm.year} créée — ${genResponse?.generated ?? 0} obligation(s) générée(s).`;
    } else {
      successMessage.value = `Période ${monthName(periodForm.month)} ${periodForm.year} créée. Cliquez « Générer obligations » pour créer les échéances.`;
    }

    isFormOpen.value = false;
    await loadPeriods();
    await marketStore.refreshFromBackend();
  } catch (error) {
    formError.value = error?.payload?.message || error?.message || 'Impossible de créer la période.';
  } finally {
    isSaving.value = false;
  }
}

async function generate(period) {
  isGenerating.value = period.id;
  successMessage.value = '';

  try {
    const response = await generateObligationsApi(period.id);
    successMessage.value = `${response?.generated ?? 0} obligation(s) générée(s) pour ${monthName(period.month)} ${period.year}.`;
    await loadPeriods();
    await marketStore.refreshFromBackend();
  } catch (error) {
    successMessage.value = '';
    formError.value = error?.payload?.message || error?.message || 'Impossible de générer les obligations.';
  } finally {
    isGenerating.value = null;
  }
}

async function deletePeriod(period) {
  if (!confirm(`Supprimer la période ${monthName(period.month)} ${period.year} ?`)) return;
  try {
    await deleteRentPeriodApi(period.id);
    await loadPeriods();
    await marketStore.refreshFromBackend();
  } catch (error) {
    alert(error?.payload?.message || error?.message || 'Impossible de supprimer cette période.');
  }
}

// Recalculer les dates quand mois/année changent
watch(() => [periodForm.year, periodForm.month], () => syncDates());

// Charger au montage
loadPeriods();
</script>
