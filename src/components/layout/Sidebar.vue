<template>
  <aside
    :class="[
      'flex h-screen shrink-0 flex-col overflow-y-auto border-r border-blue-950/30 bg-[#1B2CC1] text-white transition-all duration-200 ease-in-out',
      collapsed ? 'w-16' : 'w-64',
    ]"
  >
    <div :class="['flex items-center border-b border-white/15', collapsed ? 'flex-col justify-center gap-2 p-3' : 'justify-between gap-3 p-5']">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-xl font-bold text-[#1B2CC1]">
          M
        </div>
        <div v-if="!collapsed" class="min-w-0 truncate">
          <span class="block truncate text-base font-bold leading-tight text-white">MarketManager</span>
          <!-- <span class="block truncate text-[10px] font-medium text-white/80">Bujumbura Market OS</span> -->
        </div>
      </div>

      <button
        class="cursor-pointer p-1.5 text-white/80 transition-colors hover:bg-[#ABD2FA] hover:text-[#1B2CC1]"
        :title="collapsed ? 'Déplier le menu' : 'Replier le menu'"
        :aria-label="collapsed ? 'Déplier le menu' : 'Replier le menu'"
        @click="$emit('toggle-sidebar')"
      >
        <ChevronRight v-if="collapsed" class="h-4 w-4" />
        <ChevronLeft v-else class="h-4 w-4" />
      </button>
    </div>

    <nav :class="['flex-1 space-y-1 overflow-y-auto', collapsed ? 'p-2' : 'p-3']">
      <template v-for="item in items" :key="item.tab">
        <RouterLink
          v-if="item.path"
          :to="item.path"
          :title="item.label"
          :class="[
            collapsed
              ? 'relative flex w-full items-center justify-center p-2.5 transition-colors group'
              : 'flex w-full items-center justify-between px-3 py-2 text-xs font-medium transition-colors group',
            currentTab === item.tab
              ? 'bg-white text-[#1B2CC1] font-bold shadow-sm'
              : 'text-white hover:bg-[#ABD2FA] hover:text-[#1B2CC1]',
          ]"
        >
          <div :class="['flex min-w-0 items-center gap-3', collapsed ? 'justify-center' : '']">
            <component
              :is="item.icon"
              :class="['h-4 w-4 shrink-0', currentTab === item.tab ? 'text-[#1B2CC1]' : 'text-white group-hover:text-[#1B2CC1]']"
            />
            <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
          </div>

          <span
            v-if="!collapsed && item.badge"
            :class="[
              'ml-1.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
              currentTab === item.tab ? 'bg-[#1B2CC1] text-white' : 'bg-white/20 text-white group-hover:bg-[#1B2CC1] group-hover:text-white',
            ]"
          >
            {{ item.badge }}
          </span>

          <span
            v-if="collapsed && item.badge"
            class="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ABD2FA] ring-2 ring-[#1B2CC1]"
          />
          <span v-if="currentTab === item.tab && collapsed" class="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 bg-[#ABD2FA]" />
        </RouterLink>
      </template>
    </nav>

    <div :class="['mt-auto border-t border-white/15 bg-[#152399]', collapsed ? 'p-2' : 'p-4']">
      <div :class="['flex items-center', collapsed ? 'justify-center' : 'gap-3']">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center border border-white/30 bg-white/20 text-xs font-bold text-white">
          {{ roleAbbr }}
        </div>
        <div v-if="!collapsed" class="min-w-0 flex-1">
          <div class="truncate text-xs font-semibold text-white">{{ currentUser.name }}</div>
          <div class="truncate text-[10px] text-white/80">{{ currentUser.title }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

defineProps({
  items: { type: Array, default: () => [] },
  currentTab: { type: String, required: true },
  currentUser: { type: Object, required: true },
  collapsed: { type: Boolean, default: false },
  roleAbbr: { type: String, default: 'SA' },
});

defineEmits(['toggle-sidebar']);
</script>
