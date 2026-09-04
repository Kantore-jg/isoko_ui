<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
    <div class="relative my-6 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div class="flex items-center justify-between bg-emerald-700 px-6 py-4 text-white">
        <div>
          <h3 class="text-sm font-bold">Enregistrer un paiement de loyer</h3>
          <p class="text-[11px] text-emerald-100">Délivrance de reçu comptable officiel</p>
        </div>
        <button class="rounded-lg p-1 text-emerald-100 hover:bg-emerald-800 hover:text-white" @click="close">X</button>
      </div>

      <div class="space-y-4 p-6 text-xs">
        <DataStatePanel
          v-if="isLoadingData"
          :loading="true"
          title="Préparation du paiement"
          loading-message="Chargement des commerçants, places et banques..."
        />

        <DataStatePanel
          v-else-if="!hasReferenceData"
          :empty="true"
          title="Référentiel incomplet"
          empty-message="Ajoutez au moins un commerçant actif, une place occupée et une banque avant d'encaisser un loyer."
        />

        <form v-else class="space-y-4" @submit.prevent="submit">

          <!-- Commerçant -->
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Commerçant *</span>
            <select v-model="form.merchantId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
              <option value="" disabled>Sélectionner un commerçant</option>
              <option v-for="merchant in activeMerchants" :key="merchant.id" :value="merchant.id">
                {{ merchant.name }}
              </option>
            </select>
          </label>

          <!-- Place (lecture seule, déduite du commerçant) -->
          <div v-if="selectedMerchant" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[10px] font-bold uppercase text-slate-400">Marché / Place</p>
                <p class="mt-0.5 text-sm font-bold text-slate-900">{{ selectedMerchant.currentPlaceCode || 'Non affecté' }}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-bold uppercase text-slate-400">Loyer mensuel</p>
                <p class="mt-0.5 text-sm font-bold text-emerald-700">{{ currentRentPrice.toLocaleString() }} FBu</p>
              </div>
            </div>
          </div>

          <!-- Période du loyer -->
          <div>
            <span class="mb-1 block font-semibold text-slate-700">Période du loyer *</span>
            <div class="grid grid-cols-2 gap-3">
              <select v-model.number="form.periodMonth" class="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none">
                <option v-for="month in months" :key="month.num" :value="month.num">{{ month.name }}</option>
              </select>
              <input v-model.number="form.periodYear" type="number" class="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </div>
          </div>

          <!-- Infos obligation ciblée -->
          <div v-if="targetedObligation" class="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <p class="mb-2 text-[10px] font-bold uppercase text-emerald-700">Obligation ciblée — {{ targetedObligation.period_label }}</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <p class="text-[10px] font-bold uppercase text-slate-400">Montant du loyer</p>
                <p class="mt-0.5 text-sm font-extrabold text-slate-900">{{ targetedObligation.amount_expected.toLocaleString() }} FBu</p>
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase text-slate-400">Déjà payé</p>
                <p class="mt-0.5 text-sm font-extrabold text-emerald-700">{{ targetedObligation.amount_paid.toLocaleString() }} FBu</p>
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase text-slate-400">Reste à payer</p>
                <p class="mt-0.5 text-sm font-extrabold" :class="targetedObligation.balance > 0 ? 'text-rose-600' : 'text-emerald-700'">
                  {{ targetedObligation.balance.toLocaleString() }} FBu
                </p>
              </div>
            </div>
          </div>

          <div v-else-if="form.merchantId && !isPreviewLoading" class="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p class="text-[11px] font-semibold text-amber-800">
              Aucune obligation trouvée pour {{ selectedMonthLabel }} {{ form.periodYear }}.
              Vérifiez que la période de loyer existe et que les obligations ont été générées.
            </p>
          </div>

          <!-- Montant + Banque -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Montant *</span>
              <input v-model.number="form.amount" type="number" min="1" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Banque *</span>
              <select v-model="form.bankId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
                <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
              </select>
            </label>
          </div>

          <!-- Date de paiement + Référence -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Date de paiement *</span>
              <input v-model="form.paymentDate" type="date" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </label>
            <label class="block">
              <span class="mb-1 block font-semibold text-slate-700">Référence du reçu *</span>
              <input v-model="form.referenceNumber" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono focus:bg-white focus:outline-none" required>
            </label>
          </div>

          <!-- Indicateur timing paiement -->
          <div v-if="paymentTiming" class="rounded-lg px-4 py-2" :class="timingClass">
            <p class="text-[11px] font-semibold" :class="timingTextClass">
              <span v-if="paymentTiming === 'EARLY'">Paiement effectué avant la date d'échéance ({{ targetedObligation?.due_date }}).</span>
              <span v-else-if="paymentTiming === 'ON_TIME'">Paiement effectué à la date d'échéance.</span>
              <span v-else>Paiement effectué après la date d'échéance ({{ targetedObligation?.due_date }}). Retard enregistré.</span>
            </p>
          </div>

          <!-- Allocations multi-mois (si montant > obligation ciblée) -->
          <div v-if="allocationList.length > 1" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="mb-2 text-[10px] font-bold uppercase text-slate-500">Répartition du paiement</p>
            <div class="space-y-1.5">
              <div v-for="alloc in allocationList" :key="alloc.rent_obligation_id" class="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs">
                <span class="font-semibold text-slate-700">
                  {{ alloc.period ? `${monthNameByNum(alloc.period.month)} ${alloc.period.year}` : `Obligation #${alloc.rent_obligation_id}` }}
                </span>
                <span class="font-bold text-emerald-700">{{ alloc.amount_allocated.toLocaleString() }} FBu</span>
              </div>
            </div>
          </div>

          

         

          <!-- Notes -->
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Notes</span>
            <textarea v-model="form.notes" rows="2" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"></textarea>
          </label>

          <p v-if="formError" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {{ formError }}
          </p>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="close">
              Annuler
            </button>
            <button
              type="submit"
              class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSubmitting || (allocationRemaining > 0 && !isPreviewLoading)"
            >
              {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer le paiement' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import DataStatePanel from '../common/DataStatePanel.vue';
import { previewPaymentAllocationApi } from '../../services/marketApi.js';
import { marketStore } from '../../store/index.js';

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const currentDate = formatLocalDate(today);

const isOpen = computed(() => marketStore.state.isNewPaymentModalOpen);
const isLoadingData = computed(() => marketStore.state.isLoadingData);
const activeMerchants = computed(() => marketStore.state.merchants.filter((m) => m.status === 'ACTIVE' && m.currentPlaceId));
const occupiedPlaces = computed(() => marketStore.state.places.filter((p) => p.status === 'OCCUPIED'));
const banks = computed(() => marketStore.state.banks);
const hasReferenceData = computed(() => activeMerchants.value.length > 0 && occupiedPlaces.value.length > 0 && banks.value.length > 0);
const isSubmitting = ref(false);
const formError = ref('');
const isPreviewLoading = ref(false);
const allocationPreview = ref(null);
let previewRequestId = 0;
let previewTimer = null;

const months = [
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

function monthNameByNum(num) {
  return months.find((m) => m.num === num)?.name || `Mois ${num}`;
}

const form = reactive({
  merchantId: '',
  periodYear: currentYear,
  periodMonth: currentMonth,
  amount: 50000,
  bankId: '',
  referenceNumber: '',
  paymentDate: currentDate,
  notes: '',
});

const selectedMerchant = computed(() => {
  if (!form.merchantId) return null;
  return activeMerchants.value.find((m) => m.id === Number(form.merchantId)) || null;
});

const currentRentPrice = computed(() => {
  if (!selectedMerchant.value) return 0;
  const place = occupiedPlaces.value.find((p) => p.id === selectedMerchant.value.currentPlaceId);
  return place?.rentPrice || 0;
});

const selectedMonthLabel = computed(() => monthNameByNum(form.periodMonth));

const targetedObligation = computed(() => allocationPreview.value?.targeted_obligation || null);
const paymentTiming = computed(() => allocationPreview.value?.payment_timing || null);
const availableOutstanding = computed(() => Number(allocationPreview.value?.total_outstanding ?? 0));
const allocationRemaining = computed(() => Number(allocationPreview.value?.remaining ?? 0));
const allocationList = computed(() => allocationPreview.value?.allocations || []);
const allocationCount = computed(() => allocationList.value.length);

const timingClass = computed(() => {
  if (paymentTiming.value === 'EARLY') return 'border border-emerald-200 bg-emerald-50';
  if (paymentTiming.value === 'ON_TIME') return 'border border-blue-200 bg-blue-50';
  return 'border border-rose-200 bg-rose-50';
});

const timingTextClass = computed(() => {
  if (paymentTiming.value === 'EARLY') return 'text-emerald-800';
  if (paymentTiming.value === 'ON_TIME') return 'text-blue-800';
  return 'text-rose-800';
});

function seedForm() {
  const merchant = activeMerchants.value[0];
  const bank = banks.value[0];
  const prefix = marketStore.state.market?.receiptPrefix || 'REC';
  form.merchantId = merchant?.id || '';
  form.amount = currentRentPrice.value || 50000;
  form.bankId = bank?.id || '';
  form.periodYear = currentYear;
  form.periodMonth = currentMonth;
  form.paymentDate = currentDate;
  form.referenceNumber = `${prefix}-${currentYear}-${String(marketStore.state.payments.length + 146).padStart(6, '0')}`;
  form.notes = '';
  formError.value = '';
  allocationPreview.value = null;
  isPreviewLoading.value = false;
  previewRequestId += 1;
}

// Pre-fill amount from the selected merchant's rent price
watch(
  () => selectedMerchant.value,
  (merchant) => {
    if (merchant) {
      const place = occupiedPlaces.value.find((p) => p.id === merchant.currentPlaceId);
      if (place?.rentPrice) {
        form.amount = place.rentPrice;
      }
    }
  }
);

watch(
  isOpen,
  (open) => {
    if (open) seedForm();
  },
  { immediate: true }
);

async function loadAllocationPreview() {
  const merchantId = Number(form.merchantId);
  const amount = Number(form.amount);
  const asOfDate = form.paymentDate;
  const periodYear = form.periodYear;
  const periodMonth = form.periodMonth;

  if (!merchantId || !Number.isFinite(amount) || amount <= 0) {
    allocationPreview.value = null;
    isPreviewLoading.value = false;
    return;
  }

  const requestId = ++previewRequestId;
  isPreviewLoading.value = true;

  try {
    const response = await previewPaymentAllocationApi({
      merchant_id: merchantId,
      amount,
      as_of_date: asOfDate,
      period_year: periodYear,
      period_month: periodMonth,
    });

    if (requestId !== previewRequestId) return;
    allocationPreview.value = response.data || null;
  } catch {
    if (requestId !== previewRequestId) return;
    allocationPreview.value = null;
  } finally {
    if (requestId === previewRequestId) {
      isPreviewLoading.value = false;
    }
  }
}

watch(
  () => [form.merchantId, form.amount, form.paymentDate, form.periodYear, form.periodMonth],
  () => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      loadAllocationPreview();
    }, 250);
  }
);

async function submit() {
  isSubmitting.value = true;
  formError.value = '';

  try {
    await marketStore.recordPayment({
      merchantId: form.merchantId,
      paymentDate: form.paymentDate,
      amount: form.amount,
      bankId: form.bankId,
      referenceNumber: form.referenceNumber,
      notes: form.notes,
      autoAllocate: true,
      asOfDate: form.paymentDate,
      periodYear: form.periodYear,
      periodMonth: form.periodMonth,
    });
    close();
  } catch (error) {
    formError.value = error?.payload?.message || error?.message || 'Impossible d\'enregistrer le paiement.';
  } finally {
    isSubmitting.value = false;
  }
}

function close() {
  marketStore.setIsNewPaymentModalOpen(false);
  formError.value = '';
  isSubmitting.value = false;
  isPreviewLoading.value = false;
  allocationPreview.value = null;
  previewRequestId += 1;
  clearTimeout(previewTimer);
  previewTimer = null;
}
</script>
