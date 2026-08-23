<template>
  <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Blocs & tarifs</h2>
        <p class="mt-1 text-xs text-slate-500">Création, édition et suivi des blocs du marché.</p>
      </div>
      <button
        class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="openCreate"
      >
        Nouveau bloc
      </button>
    </div>

    <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
          <tr>
            <th class="px-4 py-3">Bloc</th>
            <th class="px-4 py-3">Catégorie</th>
            <th class="px-4 py-3">Tarif</th>
            <th class="px-4 py-3">Places</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="block in blocks" :key="block.id">
            <td class="px-4 py-3 font-semibold text-slate-900">{{ block.name }}</td>
            <td class="px-4 py-3">{{ block.category }}</td>
            <td class="px-4 py-3">{{ money(block.defaultRentPrice) }}</td>
            <td class="px-4 py-3">{{ block.totalPlaces }}</td>
            <td class="px-4 py-3">
              <button class="text-xs font-semibold text-emerald-700 hover:underline" @click="openEdit(block)">
                Modifier
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-sm font-bold text-slate-900">
          {{ editingBlock ? 'Modifier le bloc' : 'Créer un nouveau bloc' }}
        </h3>

        <form class="space-y-4 text-xs" @submit.prevent="save">
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Code du bloc *</label>
            <input v-model="form.code" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Nom complet *</label>
            <input v-model="form.name" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Catégorie *</label>
              <input v-model="form.category" type="text" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" required>
            </div>
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Tarif (FBu) *</label>
              <input v-model.number="form.defaultRentPrice" type="number" min="1000" step="1000" class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold focus:bg-white focus:outline-none" required>
            </div>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none" />
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" @click="close">
              Annuler
            </button>
            <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              {{ editingBlock ? 'Enregistrer' : 'Créer le bloc' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { formatCurrency } from '../../utils/format.js';
import { marketStore } from '../../store/index.js';

const blocks = marketStore.state.blocks;
const money = (value) => formatCurrency(value, 'FBu');

const isOpen = ref(false);
const editingBlock = ref(null);
const form = reactive({
  code: '',
  name: '',
  category: '',
  defaultRentPrice: 0,
  description: '',
});

function resetForm(block = null) {
  editingBlock.value = block;
  form.code = block?.code || '';
  form.name = block?.name || '';
  form.category = block?.category || '';
  form.defaultRentPrice = block?.defaultRentPrice || 0;
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

function save() {
  const payload = {
    code: form.code.trim(),
    name: form.name.trim(),
    category: form.category.trim(),
    defaultRentPrice: Number(form.defaultRentPrice) || 0,
    description: form.description.trim(),
    totalPlaces: editingBlock.value?.totalPlaces || 0,
    marketId: editingBlock.value?.marketId || marketStore.state.market.id,
  };

  if (editingBlock.value) {
    marketStore.updateBlock(editingBlock.value.id, payload);
  } else {
    marketStore.addBlock(payload);
  }

  close();
}

function close() {
  isOpen.value = false;
  editingBlock.value = null;
}
</script>
