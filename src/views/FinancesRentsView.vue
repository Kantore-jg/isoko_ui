<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <RentObligationsList />
    <ReceiptsList />
  </div>
</template>

<script setup>
import RentObligationsList from '../components/finances/RentObligationsList.vue';
import ReceiptsList from '../components/finances/ReceiptsList.vue';
</script>
