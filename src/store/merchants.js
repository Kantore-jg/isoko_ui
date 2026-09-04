import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  createAssignmentApi,
  createMerchantApi,
  deleteMerchantApi,
  listApi,
  listMerchantsApi,
  terminateAssignmentApi,
  updateMerchantApi,
} from '../services/marketApi.js';
import { mapAssignment, mapMerchant, mapMovement } from '../services/apiMappers.js';

export const useMerchantsStore = defineStore('merchants', () => {
  const merchants = ref([]);
  const assignments = ref([]);
  const movements = ref([]);

  function setMerchants(data) {
    merchants.value = data;
  }

  function setAssignments(data) {
    assignments.value = data;
  }

  function setMovements(data) {
    movements.value = data;
  }

  async function loadMerchants() {
    const response = await listMerchantsApi({ per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    merchants.value = data.map(mapMerchant);
    return merchants.value;
  }

  async function loadAssignments() {
    const response = await listApi('assignments', { per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    assignments.value = data.map(mapAssignment);
    return assignments.value;
  }

  async function loadMovements() {
    const response = await listApi('movements', { per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    movements.value = data.map(mapMovement);
    return movements.value;
  }

  function makeMerchantCode(name) {
    const base = String(name || 'MRC').trim().replace(/[^A-Z0-9]+/gi, '-').toUpperCase().slice(0, 12) || 'MRC';
    return `${base}-${Date.now().toString().slice(-6)}`;
  }

  async function addMerchant(data) {
    await createMerchantApi({
      merchant_code: makeMerchantCode(data.name),
      business_name: data.name,
      owner_name: data.ownerName || data.name,
      national_id: data.cni,
      phone: data.phone,
      business_type: data.activity || data.category || '',
      address: data.address || data.notes || '',
      status: data.status || 'ACTIVE',
      registration_date: data.registrationDate || new Date().toISOString().slice(0, 10),
      notes: data.notes || data.address || '',
    });
  }

  async function updateMerchant(id, data) {
    const merchant = merchants.value.find((item) => item.id === id);
    await updateMerchantApi(id, {
      merchant_code: merchant?.merchantCode || makeMerchantCode(data.name || merchant?.name),
      business_name: data.name ?? merchant?.name,
      owner_name: data.ownerName || data.name || merchant?.name,
      national_id: data.cni ?? merchant?.cni,
      phone: data.phone ?? merchant?.phone,
      business_type: data.activity || data.category || merchant?.category || '',
      address: data.address || data.notes || merchant?.address || '',
      status: data.status || merchant?.status || 'ACTIVE',
      registration_date: data.registrationDate || merchant?.registrationDate || new Date().toISOString().slice(0, 10),
      notes: data.notes || data.address || merchant?.notes || '',
    });
  }

  async function deleteMerchant(id) {
    await deleteMerchantApi(id);
  }

  async function assignPlace(placeId, merchantId, startDate, rentAmount, notes = '') {
    const targetPlace = (await import('./structure.js')).useStructureStore().places.find((p) => p.id === placeId);
    const targetMerchant = merchants.value.find((m) => m.id === merchantId);
    if (!targetPlace || !targetMerchant) return null;

    const response = await createAssignmentApi({
      place_id: placeId,
      merchant_id: merchantId,
      start_date: startDate,
      rent_amount: rentAmount,
      assignment_reason: notes || `Affectation de la place ${targetPlace.code}`,
      notes,
    });
    return response.data || null;
  }

  async function terminateAssignment(assignmentId, endDate, reason = 'Départ / Fin de contrat') {
    const response = await terminateAssignmentApi(assignmentId, {
      end_date: endDate,
      reason,
    });
    return response.data || null;
  }

  async function transferPlace(merchantId, fromPlaceId, toPlaceId, date, reason, rentAmount) {
    const oldAssignment = assignments.value.find(
      (a) => a.merchantId === merchantId && a.placeId === fromPlaceId && a.status === 'ACTIVE'
    );
    if (oldAssignment) {
      await terminateAssignment(oldAssignment.id, date, reason || 'Mutation de place');
    }
    await assignPlace(toPlaceId, merchantId, date, rentAmount, `Mutation depuis ${fromPlaceId}: ${reason}`);
    return true;
  }

  function clear() {
    merchants.value = [];
    assignments.value = [];
    movements.value = [];
  }

  return {
    merchants,
    assignments,
    movements,
    setMerchants,
    setAssignments,
    setMovements,
    loadMerchants,
    loadAssignments,
    loadMovements,
    addMerchant,
    updateMerchant,
    deleteMerchant,
    assignPlace,
    terminateAssignment,
    transferPlace,
    clear,
  };
});
