<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <RentPeriodManager />
    <RentObligationsList />
    <ReceiptsList />
  </div>
</template>

<script setup>
import RentPeriodManager from '../components/finances/RentPeriodManager.vue';
import RentObligationsList from '../components/finances/RentObligationsList.vue';
import ReceiptsList from '../components/finances/ReceiptsList.vue';
</script>
