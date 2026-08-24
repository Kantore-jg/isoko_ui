<template>
  <section class="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="text-sm font-bold text-slate-900">Journal d'audit</h2>

    <DataStatePanel
      class="mt-4"
      :loading="state.isLoadingData"
      :error="state.dataError"
      :empty="!state.isLoadingData && !state.dataError && state.auditLogs.length === 0"
      title="Audit"
      loading-message="Chargement du journal d'audit..."
      error-message="Impossible de charger le journal d'audit."
      empty-message="Aucune entrée d'audit pour le moment."
    />

    <div
      v-if="!state.isLoadingData && !state.dataError && state.auditLogs.length > 0"
      class="mt-4 overflow-hidden rounded-2xl border border-slate-200"
    >
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
          <tr>
            <th class="px-4 py-3">Date</th>
            <th class="px-4 py-3">Action</th>
            <th class="px-4 py-3">Détails</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="log in state.auditLogs" :key="log.id">
            <td class="px-4 py-3 text-slate-500 text-xs">{{ log.timestamp }}</td>
            <td class="px-4 py-3 font-semibold text-slate-900 text-xs">{{ log.actionLabel }}</td>
            <td class="px-4 py-3 text-xs text-slate-600">{{ log.details }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import DataStatePanel from '../components/common/DataStatePanel.vue';
import { marketStore } from '../store/index.js';

const state = marketStore.state;
</script>
