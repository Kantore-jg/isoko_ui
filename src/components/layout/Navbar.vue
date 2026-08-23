<template>
  <header class="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
    <div class="flex min-w-0 items-center gap-3">
      <button
        class="shrink-0 cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        :title="collapsed ? 'Déplier le menu latéral' : 'Replier le menu latéral'"
        @click="$emit('toggle-sidebar')"
      >
        <PanelLeftOpen v-if="collapsed" class="h-5 w-5 text-emerald-600" />
        <PanelLeftClose v-else class="h-5 w-5 text-slate-600" />
      </button>

      <div class="min-w-0">
        <h1 class="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">{{ title }}</h1>
        <p class="truncate text-[11px] font-medium text-slate-400 sm:text-xs">{{ subtitle }}</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="relative hidden w-64 md:block lg:w-72">
        <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          placeholder="Rechercher place, reçu, commerçant..."
          class="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8.5 pr-3 text-xs placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
      </div>

      <button
        v-if="currentUser.role !== 'SUPER_ADMIN'"
        class="flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800"
        @click="$emit('open-payment')"
      >
        <PlusCircle class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">Nouveau Paiement</span>
      </button>

      <button
        v-else
        class="flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        @click="$emit('navigate', '/tools/excel')"
      >
        <FileSpreadsheet class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">Rapport Excel</span>
      </button>

      <div class="relative">
        <button
          class="relative cursor-pointer rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          title="Alertes Loyers"
          @click="$emit('toggle-notifications')"
        >
          <Bell class="h-4 w-4" />
          <span v-if="overdueCount > 0" class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>
      </div>

      <div class="relative">
        <button
          class="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-2 pr-2.5 py-1 text-left transition-colors hover:bg-slate-100"
          @click="$emit('toggle-role-menu')"
        >
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
            {{ roleAbbr }}
          </div>
          <div class="hidden lg:block text-left">
            <p class="text-xs font-bold leading-tight text-slate-800">{{ currentUser.name }}</p>
            <p class="text-[10px] font-semibold text-emerald-600">{{ currentUserTitle }}</p>
          </div>
          <ChevronDown class="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import {
  Bell,
  ChevronDown,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Search,
} from 'lucide-vue-next';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  currentUser: { type: Object, required: true },
  roleAbbr: { type: String, required: true },
  currentUserTitle: { type: String, required: true },
  overdueCount: { type: Number, default: 0 },
  searchQuery: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
});

defineEmits([
  'toggle-sidebar',
  'toggle-role-menu',
  'toggle-notifications',
  'open-payment',
  'navigate',
  'update:searchQuery',
]);
</script>
