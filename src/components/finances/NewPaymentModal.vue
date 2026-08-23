<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
    <div class="relative my-6 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div class="flex items-center justify-between bg-emerald-700 px-6 py-4 text-white">
        <div>
          <h3 class="text-sm font-bold">Enregistrement d'un paiement de loyer</h3>
          <p class="text-[11px] text-emerald-100">Délivrance de reçu comptable officiel</p>
        </div>
        <button class="rounded-lg p-1 text-emerald-100 hover:bg-emerald-800 hover:text-white" @click="close">X</button>
      </div>

      <form class="space-y-4 p-6 text-xs" @submit.prevent="submit">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Commerçant *</span>
            <select v-model="form.merchantId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
              <option v-for="merchant in activeMerchants" :key="merchant.id" :value="merchant.id">
                {{ merchant.name }}
              </option>
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Place *</span>
            <select v-model="form.placeId" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
              <option v-for="place in occupiedPlaces" :key="place.id" :value="place.id">
                {{ place.code }} - {{ place.blockCode }}
              </option>
            </select>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Mois *</span>
            <select v-model.number="form.periodMonth" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none">
              <option v-for="month in months" :key="month.num" :value="month.num">{{ month.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Année *</span>
            <input v-model.number="form.periodYear" type="number" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </label>
        </div>

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

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Référence *</span>
            <input v-model="form.referenceNumber" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono focus:bg-white focus:outline-none" required>
          </label>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Date de paiement *</span>
            <input v-model="form.paymentDate" type="date" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </label>
        </div>

        <label class="block">
          <span class="mb-1 block font-semibold text-slate-700">Notes</span>
          <textarea v-model="form.notes" rows="3" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
        </label>

        <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="close">
            Annuler
          </button>
          <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
            Enregistrer le paiement
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { marketStore } from '../../store/index.js';

const isOpen = computed(() => marketStore.state.isNewPaymentModalOpen);
const activeMerchants = computed(() => marketStore.state.merchants.filter((merchant) => merchant.status === 'ACTIVE' && merchant.currentPlaceId));
const occupiedPlaces = computed(() => marketStore.state.places.filter((place) => place.status === 'OCCUPIED'));
const banks = computed(() => marketStore.state.banks);

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

const form = reactive({
  merchantId: '',
  placeId: '',
  periodYear: 2026,
  periodMonth: 8,
  amount: 50000,
  bankId: '',
  referenceNumber: '',
  paymentDate: '2026-08-23',
  notes: '',
});

function seedForm() {
  const merchant = activeMerchants.value[0];
  const place = occupiedPlaces.value[0];
  const bank = banks.value[0];
  const prefix = marketStore.state.market?.receiptPrefix || 'REC';
  form.merchantId = merchant?.id || '';
  form.placeId = place?.id || '';
  form.amount = place?.rentPrice || 50000;
  form.bankId = bank?.id || '';
  form.referenceNumber = `${prefix}-2026-${String(marketStore.state.payments.length + 146).padStart(6, '0')}`;
}

watch(
  isOpen,
  (open) => {
    if (open) seedForm();
  },
  { immediate: true }
);

async function submit() {
  await marketStore.recordPayment({ ...form });
}

function close() {
  marketStore.setIsNewPaymentModalOpen(false);
}
</script>
