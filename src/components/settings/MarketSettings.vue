<template>
  <section class="max-w-4xl space-y-6">
    <div>
      <h2 class="text-lg font-bold text-slate-900">Paramètres généraux du marché</h2>
      <p class="mt-0.5 text-xs text-slate-500">Configuration des coordonnées administratives et de l’en-tête des reçus.</p>
    </div>

    <div class="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form class="space-y-5 text-xs" @submit.prevent="save">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Nom officiel du marché *</span>
            <input v-model="form.name" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-900 focus:bg-white focus:outline-none" required>
          </label>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Devise principale *</span>
            <input v-model="form.currency" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none" required>
          </label>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Adresse *</span>
            <input v-model="form.address" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none" required>
          </label>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Ville *</span>
            <input v-model="form.city" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none" required>
          </label>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Pays *</span>
            <input v-model="form.country" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none" required>
          </label>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Téléphone secrétariat</span>
            <input v-model="form.phone" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none">
          </label>
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Email officiel</span>
            <input v-model="form.email" type="email" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none">
          </label>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label class="block">
            <span class="mb-1 block font-semibold text-slate-700">Préfixe des reçus</span>
            <input v-model="form.receiptPrefix" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none">
          </label>
        </div>

        <div class="flex items-center justify-between border-t border-slate-100 pt-4">
          <span v-if="saved" class="text-xs font-bold text-emerald-600">Paramètres enregistrés avec succès.</span>
          <button type="submit" class="ml-auto rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            Sauvegarder les paramètres
          </button>
        </div>
      </form>
    </div>

    <div class="rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
      <h3 class="text-xs font-bold uppercase text-rose-900">Réinitialisation des données de démonstration</h3>
      <p class="mt-2 text-xs text-slate-600">Remet à zéro la base locale avec le jeu de données officiel.</p>
      <button class="mt-4 rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100" @click="reset">
        Réinitialiser le jeu de données
      </button>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { marketStore } from '../../store/index.js';

const saved = ref(false);
const form = reactive({
  name: '',
  currency: '',
  address: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  receiptPrefix: 'REC',
});

watch(
  () => marketStore.state.market,
  (market) => {
    if (!market) return;
    form.name = market.name || '';
    form.currency = market.currency || '';
    form.address = market.address || '';
    form.city = market.city || '';
    form.country = market.country || '';
    form.phone = market.phone || '';
    form.email = market.email || '';
    form.receiptPrefix = market.receiptPrefix || 'REC';
  },
  { immediate: true }
);

async function save() {
  await marketStore.updateMarket({ ...form });
  saved.value = true;
  window.setTimeout(() => {
    saved.value = false;
  }, 2500);
}

function reset() {
  marketStore.resetToDefaults();
}
</script>
