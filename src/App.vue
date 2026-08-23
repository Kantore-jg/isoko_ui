<template>
  <div v-if="ready && state" class="relative flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 antialiased">
    <Sidebar
      :items="visibleRoutes"
      :current-tab="activeTab"
      :current-user="state.currentUser"
      :collapsed="state.sidebarCollapsed"
      :role-abbr="roleAbbr"
      @toggle-sidebar="toggleSidebar"
    />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Navbar
        :title="pageTitle"
        :subtitle="pageSubtitle"
        :current-user="state.currentUser"
        :role-abbr="roleAbbr"
        :current-user-title="state.currentUser.title"
        :overdue-count="overdueCount"
        :search-query="searchQuery"
        :collapsed="state.sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-role-menu="toggleRoleMenu"
        @toggle-notifications="toggleNotifications"
        @open-payment="openPaymentDrawer"
        @navigate="navigate"
        @update:searchQuery="searchQuery = $event"
      />

      <div v-if="showNotifications" class="absolute right-6 top-20 z-40 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 class="text-xs font-semibold text-slate-800">Alertes Loyers</h3>
          <span class="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{{ overdueCount }} impayés</span>
        </div>
        <div class="mt-3 space-y-2 max-h-60 overflow-y-auto">
          <article v-for="item in overdueMerchants.slice(0, 5)" :key="item.merchant.id" class="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p class="text-xs font-semibold text-slate-800">{{ item.merchant.name }}</p>
            <p class="text-[11px] text-slate-500">{{ item.placeCode }} • {{ item.blockCode }}</p>
            <p class="mt-1 text-[11px] font-semibold text-amber-700">{{ money(item.totalOverdue) }} dû</p>
          </article>
          <p v-if="!overdueMerchants.length" class="text-xs text-slate-500">Aucune alerte active.</p>
        </div>
        <button class="mt-3 w-full text-center text-xs font-semibold text-emerald-600 hover:underline" @click="navigate('/finances/rents')">
          Voir tous les loyers
        </button>
      </div>

      <div v-if="showRoleMenu" class="absolute right-6 top-20 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
        <p class="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Changer de rôle</p>
        <button class="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50" @click="changeRole('SUPER_ADMIN')">
          <ShieldCheck class="mt-0.5 h-4 w-4 text-emerald-600" />
          <div>
            <p class="text-xs font-semibold text-slate-800">Super Admin</p>
            <p class="text-[11px] text-slate-500">Observation stratégique & analyse</p>
          </div>
        </button>
        <button class="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50" @click="changeRole('ADMIN')">
          <UserCheck class="mt-0.5 h-4 w-4 text-blue-600" />
          <div>
            <p class="text-xs font-semibold text-slate-800">Admin / Commissaire</p>
            <p class="text-[11px] text-slate-500">Gestion des blocs, places & commerçants</p>
          </div>
        </button>
        <button class="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50" @click="changeRole('ACCOUNTANT')">
          <CreditCard class="mt-0.5 h-4 w-4 text-amber-600" />
          <div>
            <p class="text-xs font-semibold text-slate-800">Chef Comptable</p>
            <p class="text-[11px] text-slate-500">Guichet reçus, loyers & banques</p>
          </div>
        </button>
      </div>

      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div class="mx-auto max-w-7xl space-y-6">
          <section v-if="currentView === 'dashboard-super'" class="space-y-6">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Loyers attendus" :value="money(kpis.expectedMonthly)" helper="Ce mois-ci" tone-class="bg-emerald-50 text-emerald-700">
                <template #icon><DollarSign class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Loyers encaissés" :value="money(kpis.obtainedMonthly)" helper="Août 2026" tone-class="bg-blue-50 text-blue-700">
                <template #icon><Receipt class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Taux d'occupation" :value="`${kpis.occupancyRate}%`" helper="Places occupées" tone-class="bg-amber-50 text-amber-700">
                <template #icon><Grid class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Commerçants actifs" :value="String(kpis.activeMerchants)" helper="Sur l’ensemble" tone-class="bg-slate-100 text-slate-700">
                <template #icon><Users class="h-5 w-5" /></template>
              </MetricCard>
            </div>

            <div class="grid gap-6 xl:grid-cols-3">
              <div class="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                  <div>
                    <h2 class="text-sm font-bold text-slate-900">Évolution Financière Mensuelle</h2>
                    <p class="text-xs text-slate-500">Vue consolidée 2026</p>
                  </div>
                  <span class="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Dashboard</span>
                </div>
                <div class="space-y-3">
                  <div v-for="trend in monthlyTrends" :key="trend.month" class="grid grid-cols-[70px_1fr_70px] items-center gap-3">
                    <span class="text-xs font-semibold text-slate-600">{{ trend.month }}</span>
                    <div class="h-3 overflow-hidden bg-slate-100">
                      <div class="h-full bg-gradient-to-r from-[#1B2CC1] to-[#ABD2FA]" :style="{ width: `${trend.rate}%` }" />
                    </div>
                    <span class="text-right text-xs font-bold text-slate-900">{{ trend.rate }}%</span>
                  </div>
                </div>
              </div>

              <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 class="text-sm font-bold text-slate-900">Alertes Loyers</h2>
                <p class="mt-1 text-xs text-slate-500">{{ overdueCount }} impayé(s)</p>
                <div class="mt-4 space-y-3">
                  <article v-for="item in overdueMerchants.slice(0, 4)" :key="item.merchant.id" class="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                    <p class="text-xs font-bold text-slate-900">{{ item.merchant.name }}</p>
                    <p class="text-[11px] text-slate-600">{{ item.placeCode }} • {{ item.blockCode }}</p>
                    <p class="mt-1 text-[11px] font-semibold text-amber-700">{{ money(item.totalOverdue) }} dû</p>
                  </article>
                  <p v-if="!overdueMerchants.length" class="text-xs text-slate-500">Aucun impayé détecté.</p>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="currentView === 'dashboard-admin'" class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
              <MetricCard label="Places du marché" :value="String(kpis.totalPlaces)" helper="Base installée" tone-class="bg-blue-50 text-blue-700">
                <template #icon><MapPin class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Places disponibles" :value="String(kpis.availablePlaces)" helper="Libre ou en attente" tone-class="bg-emerald-50 text-emerald-700">
                <template #icon><Building2 class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Places maintenance" :value="String(kpis.maintenancePlaces)" helper="Travaux en cours" tone-class="bg-amber-50 text-amber-700">
                <template #icon><Wrench class="h-5 w-5" /></template>
              </MetricCard>
            </div>
            <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="text-sm font-bold text-slate-900">Blocs & occupation</h2>
              <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article v-for="block in blockStats" :key="block.id" class="rounded-2xl border border-slate-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-900">{{ block.code }}</h3>
                    <span class="text-[10px] font-bold text-slate-500">{{ block.occupancyRate }}%</span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">{{ block.name }}</p>
                  <div class="mt-3 h-2 overflow-hidden bg-slate-100">
                    <div class="h-full bg-[#1B2CC1]" :style="{ width: `${block.occupancyRate}%` }" />
                  </div>
                  <div class="mt-3 flex justify-between text-[11px] text-slate-500">
                    <span>{{ block.occupiedPlaces }}/{{ block.totalPlaces }} occupées</span>
                    <span>{{ money(block.expectedRevenue) }}</span>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section v-else-if="currentView === 'dashboard-accountant'" class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
              <MetricCard label="Recouvrement" :value="`${kpis.recoveryRateMonthly.toFixed(0)}%`" helper="Taux du mois" tone-class="bg-emerald-50 text-emerald-700">
                <template #icon><Percent class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Total encaissé" :value="money(kpis.obtainedAnnual)" helper="Exercice 2026" tone-class="bg-blue-50 text-blue-700">
                <template #icon><Wallet class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Impayés" :value="money(kpis.unpaidMonthly)" helper="À recouvrer" tone-class="bg-amber-50 text-amber-700">
                <template #icon><FileWarning class="h-5 w-5" /></template>
              </MetricCard>
            </div>
            <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="text-sm font-bold text-slate-900">Journal paiements récents</h2>
              <div class="mt-4 overflow-hidden">
                <table class="min-w-full divide-y divide-slate-200 text-sm">
                  <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th class="px-4 py-3">Reçu</th>
                      <th class="px-4 py-3">Commerçant</th>
                      <th class="px-4 py-3">Montant</th>
                      <th class="px-4 py-3">Banque</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="payment in state.payments" :key="payment.id">
                      <td class="px-4 py-3 font-semibold text-slate-900">{{ payment.receiptNumber }}</td>
                      <td class="px-4 py-3">{{ payment.merchantName }}</td>
                      <td class="px-4 py-3 font-semibold">{{ money(payment.amount) }}</td>
                      <td class="px-4 py-3">{{ payment.bankCode }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section v-else-if="currentView === 'dashboard-occupancy'" class="space-y-6">
            <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-sm font-bold text-slate-900">Plan 2D & matrice d’occupation</h2>
                  <p class="text-xs text-slate-500">Disposition simplifiée par bloc</p>
                </div>
                <span class="text-xs font-semibold text-slate-500">{{ kpis.occupiedPlaces }}/{{ kpis.totalPlaces }} occupées</span>
              </div>
              <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article v-for="place in state.places" :key="place.id" :class="['rounded-2xl border p-4', place.status === 'OCCUPIED' ? 'border-emerald-200 bg-emerald-50/70' : place.status === 'MAINTENANCE' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-slate-50']">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-900">{{ place.code }}</h3>
                    <span class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{{ place.status }}</span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">{{ place.blockCode }}</p>
                  <p class="mt-2 text-xs font-semibold text-slate-700">{{ place.currentMerchantName || place.notes || 'Libre' }}</p>
                </article>
              </div>
            </div>
          </section>

          <section v-else-if="currentView === 'structure-blocks'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Blocs & tarifs</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Bloc</th>
                    <th class="px-4 py-3">Catégorie</th>
                    <th class="px-4 py-3">Tarif</th>
                    <th class="px-4 py-3">Places</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="block in blockStats" :key="block.id">
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ block.name }}</td>
                    <td class="px-4 py-3">{{ block.category }}</td>
                    <td class="px-4 py-3">{{ money(block.defaultPrice) }}</td>
                    <td class="px-4 py-3">{{ block.totalPlaces }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'structure-places'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Places du marché</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Place</th>
                    <th class="px-4 py-3">Bloc</th>
                    <th class="px-4 py-3">Statut</th>
                    <th class="px-4 py-3">Commerçant</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="place in state.places" :key="place.id">
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ place.code }}</td>
                    <td class="px-4 py-3">{{ place.blockCode }}</td>
                    <td class="px-4 py-3">{{ place.status }}</td>
                    <td class="px-4 py-3">{{ place.currentMerchantName || 'Libre' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'merchants-list'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Commerçants</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Nom</th>
                    <th class="px-4 py-3">Téléphone</th>
                    <th class="px-4 py-3">Place</th>
                    <th class="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="merchant in state.merchants" :key="merchant.id">
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ merchant.name }}</td>
                    <td class="px-4 py-3">{{ merchant.phone }}</td>
                    <td class="px-4 py-3">{{ merchant.currentPlaceCode || 'N/A' }}</td>
                    <td class="px-4 py-3">{{ merchant.status }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'merchants-assignments'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Affectations actives</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Place</th>
                    <th class="px-4 py-3">Commerçant</th>
                    <th class="px-4 py-3">Début</th>
                    <th class="px-4 py-3">Loyer</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="assignment in state.assignments" :key="assignment.id">
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ assignment.placeCode }}</td>
                    <td class="px-4 py-3">{{ assignment.merchantName }}</td>
                    <td class="px-4 py-3">{{ assignment.startDate }}</td>
                    <td class="px-4 py-3">{{ money(assignment.rentAmount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'merchants-movements'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Mouvements & historique</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Date</th>
                    <th class="px-4 py-3">Place</th>
                    <th class="px-4 py-3">Type</th>
                    <th class="px-4 py-3">Motif</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="movement in state.movements" :key="movement.id">
                    <td class="px-4 py-3">{{ movement.date }}</td>
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ movement.placeCode }}</td>
                    <td class="px-4 py-3">{{ movement.typeLabel }}</td>
                    <td class="px-4 py-3">{{ movement.reason }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'finances-rents'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Loyers & reçus</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Commerçant</th>
                    <th class="px-4 py-3">Période</th>
                    <th class="px-4 py-3">Montant</th>
                    <th class="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="obligation in state.obligations" :key="obligation.id">
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ obligation.merchantName }}</td>
                    <td class="px-4 py-3">{{ obligation.periodLabel }}</td>
                    <td class="px-4 py-3">{{ money(obligation.amountExpected) }}</td>
                    <td class="px-4 py-3">{{ obligation.status }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'finances-payments'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Journal paiements & quittances</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Reçu</th>
                    <th class="px-4 py-3">Commerçant</th>
                    <th class="px-4 py-3">Montant</th>
                    <th class="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="payment in state.payments" :key="payment.id">
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ payment.receiptNumber }}</td>
                    <td class="px-4 py-3">{{ payment.merchantName }}</td>
                    <td class="px-4 py-3">{{ money(payment.amount) }}</td>
                    <td class="px-4 py-3">{{ payment.paymentDate }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'finances-banks'" class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
              <MetricCard label="Banques actives" :value="String(state.banks.length)" helper="Partenaires" tone-class="bg-blue-50 text-blue-700">
                <template #icon><Landmark class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Transactions" :value="String(totalTransactions)" helper="Historique" tone-class="bg-emerald-50 text-emerald-700">
                <template #icon><Repeat2 class="h-5 w-5" /></template>
              </MetricCard>
              <MetricCard label="Total encaissé" :value="money(totalBanked)" helper="Cumul banques" tone-class="bg-amber-50 text-amber-700">
                <template #icon><Banknote class="h-5 w-5" /></template>
              </MetricCard>
            </div>
            <div class="grid gap-4 md:grid-cols-3">
              <article v-for="bank in state.banks" :key="bank.id" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 class="text-sm font-bold text-slate-900">{{ bank.code }}</h3>
                <p class="mt-1 text-xs text-slate-500">{{ bank.name }}</p>
                <div class="mt-4 flex items-center justify-between text-xs text-slate-600">
                  <span>{{ money(bank.totalCollected) }}</span>
                  <span>{{ bank.transactionCount }} opérations</span>
                </div>
              </article>
            </div>
          </section>

          <section v-else-if="currentView === 'tools-excel'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Import / Export Excel</h2>
            <p class="mt-2 text-sm text-slate-600">Le module est prêt pour brancher l’export `.xlsx` côté backend lorsque la base métier sera connectée.</p>
          </section>

          <section v-else-if="currentView === 'tools-audit'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Journal d’audit</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
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
                    <td class="px-4 py-3">{{ log.timestamp }}</td>
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ log.actionLabel }}</td>
                    <td class="px-4 py-3">{{ log.details }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-else-if="currentView === 'admin-users'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Utilisateurs & rôles</h2>
            <div class="mt-4 grid gap-4 md:grid-cols-3">
              <article v-for="user in state.users" :key="user.id" class="rounded-2xl border border-slate-200 p-4">
                <p class="text-sm font-bold text-slate-900">{{ user.name }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ user.email }}</p>
                <p class="mt-3 text-[11px] font-semibold text-emerald-600">{{ user.role }}</p>
              </article>
            </div>
          </section>

          <section v-else-if="currentView === 'admin-settings'" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900">Paramètres marché</h2>
            <p class="mt-2 text-sm text-slate-600">Cette vue conserve l’apparence actuelle et servira de point d’entrée pour les réglages métier côté API.</p>
            <button
              class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              @click="onReset"
            >
              Réinitialiser les données locales
            </button>
          </section>
        </div>
      </main>
    </div>
  </div>

  <div v-else class="flex h-screen items-center justify-center bg-slate-50 text-slate-600">
    Chargement du tableau de bord...
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Banknote,
  Building2,
  CreditCard,
  DollarSign,
  FileWarning,
  Grid,
  Landmark,
  MapPin,
  Percent,
  Receipt,
  Repeat2,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-vue-next';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';
import MetricCard from './components/common/MetricCard.vue';
import { getVisibleRoutes, getPathFromTab } from './config/api.js';
import { formatCurrency } from './utils/format.js';
import { marketStore } from './store/index.js';

const route = useRoute();
const router = useRouter();

const state = marketStore.state;
const ready = marketStore.ready;
const searchQuery = marketStore.searchQuery;
const showRoleMenu = marketStore.showRoleMenu;
const showNotifications = marketStore.showNotifications;
const currentView = marketStore.currentView;
const pageTitle = marketStore.pageTitle;
const pageSubtitle = marketStore.pageSubtitle;
const overdueCount = marketStore.overdueCount;
const kpis = marketStore.kpis;
const monthlyTrends = marketStore.monthlyTrends;
const blockStats = marketStore.blockStats;
const overdueMerchants = marketStore.overdueMerchants;
const totalTransactions = marketStore.totalTransactions;
const totalBanked = marketStore.totalBanked;
const roleAbbr = marketStore.roleAbbr;
const activeTab = computed(() => state.activeTab);

const iconForTab = (tab) => {
  if (tab.startsWith('dashboard')) {
    return tab === 'dashboard-accountant' ? DollarSign : tab === 'dashboard-occupancy' ? Grid : MapPin;
  }
  if (tab.includes('blocks')) return Building2;
  if (tab.includes('places')) return MapPin;
  if (tab.includes('merchants')) return Users;
  if (tab.includes('finances')) return DollarSign;
  if (tab.includes('tools')) return Receipt;
  if (tab.includes('admin')) return Users;
  return Users;
};

const visibleRoutes = computed(() =>
  getVisibleRoutes(state.currentUser?.role || 'ACCOUNTANT').map((routeItem) => ({
    ...routeItem,
    icon: iconForTab(routeItem.tab),
    badge:
      routeItem.tab === 'dashboard-super'
        ? 'Boss'
        : routeItem.tab === 'finances-rents' && overdueCount.value > 0
          ? `${overdueCount.value} Impayés`
          : undefined,
  }))
);

const navigate = (path) => router.push(path);
const openPaymentDrawer = () => router.push('/finances/payments');
const changeRole = (role) => {
  marketStore.changeRole(role);
  router.push(getPathFromTab(state.activeTab));
};
const toggleSidebar = () => marketStore.toggleSidebar();
const toggleRoleMenu = () => marketStore.toggleRoleMenu();
const toggleNotifications = () => marketStore.toggleNotifications();
const onReset = () => marketStore.resetToDefaults();
const money = (value) => formatCurrency(value, 'FBu');

watch(
  () => route.path,
  (path) => {
    marketStore.syncRoute(path);
  },
  { immediate: true }
);
</script>
