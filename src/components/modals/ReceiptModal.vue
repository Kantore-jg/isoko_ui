<template>
  <div v-if="receipt" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
    <div class="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">Reçu officiel d'encaissement</h3>
          <p class="text-[11px] text-slate-500">{{ receipt.receiptNumber }}</p>
        </div>
        <button class="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800" @click="close">X</button>
      </div>

      <div class="space-y-5 p-8 text-slate-800">
        <div class="border-b-2 border-emerald-600 pb-4">
          <h4 class="text-lg font-bold text-emerald-700">{{ market.name }}</h4>
          <p class="text-xs text-slate-500">{{ market.city }}, {{ market.country }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p class="text-[11px] font-semibold uppercase text-slate-400">Banque</p>
            <p class="text-sm font-bold text-slate-800">{{ receipt.bankName }}</p>
            <p class="text-[11px] text-slate-500">{{ receipt.bankCode }}</p>
          </div>
          <div class="text-right">
            <p class="text-[11px] font-semibold uppercase text-slate-400">Référence</p>
            <p class="text-sm font-mono font-bold text-slate-900">{{ receipt.referenceNumber }}</p>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 uppercase tracking-wider text-slate-600">
              <tr>
                <th class="px-4 py-2.5">Commerçant</th>
                <th class="px-4 py-2.5">Place</th>
                <th class="px-4 py-2.5">Période</th>
                <th class="px-4 py-2.5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="px-4 py-3.5 font-bold text-slate-900">{{ receipt.merchantName }}</td>
                <td class="px-4 py-3.5">{{ receipt.placeCode }} ({{ receipt.blockCode }})</td>
                <td class="px-4 py-3.5">{{ receipt.periodLabel }}</td>
                <td class="px-4 py-3.5 text-right font-bold text-slate-900">{{ receipt.amount.toLocaleString() }} FBu</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p class="text-xs font-bold text-emerald-950">TOTAL ENCAISSÉ</p>
          <p class="text-xl font-extrabold text-emerald-700">{{ receipt.amount.toLocaleString() }} FBu</p>
        </div>

        <p v-if="receipt.notes" class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <span class="font-semibold text-slate-700">Observation:</span> {{ receipt.notes }}
        </p>

        <div class="grid grid-cols-2 gap-8 border-t border-slate-200 pt-4 text-xs">
          <div>
            <p class="text-[11px] font-semibold uppercase text-slate-500">Enregistré par</p>
            <p class="mt-1 font-bold text-slate-800">{{ receipt.recordedBy }}</p>
            <p class="text-[11px] text-slate-500">{{ receipt.recordedByRole }}</p>
          </div>
          <div class="text-right">
            <p class="text-[11px] font-semibold uppercase text-slate-500">Horodatage</p>
            <p class="mt-1 font-mono text-[11px] text-slate-500">{{ receipt.createdAt }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
        <button class="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100" @click="close">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { marketStore } from '../../store/index.js';

const receipt = computed(() => marketStore.state.selectedReceipt);
const market = computed(() => marketStore.state.market || {});

function close() {
  marketStore.setSelectedReceipt(null);
}
</script>
