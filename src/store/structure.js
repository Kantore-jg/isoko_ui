import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  createBlockApi,
  createPlaceApi,
  deleteBlockApi,
  deletePlaceApi,
  listApi,
  updateBlockApi,
  updatePlaceApi,
} from '../services/marketApi.js';
import { mapBlock, mapPlace } from '../services/apiMappers.js';

export const useStructureStore = defineStore('structure', () => {
  const blocks = ref([]);
  const places = ref([]);

  function setBlocks(data) {
    blocks.value = data;
  }

  function setPlaces(data) {
    places.value = data;
  }

  async function loadBlocks() {
    const response = await listApi('blocks', { per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    blocks.value = data.map(mapBlock);
    return blocks.value;
  }

  async function loadPlaces() {
    const response = await listApi('places', { per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    places.value = data.map(mapPlace);
    return places.value;
  }

  async function addBlock(data) {
    await createBlockApi({
      code: data.code,
      name: data.name,
      description: data.description,
      default_rent_amount: data.defaultRentPrice,
      status: data.status || 'ACTIVE',
    });
  }

  async function updateBlock(id, data) {
    await updateBlockApi(id, {
      code: data.code,
      name: data.name,
      description: data.description,
      default_rent_amount: data.defaultRentPrice,
      status: data.status || 'ACTIVE',
    });
  }

  async function deleteBlock(id) {
    await deleteBlockApi(id);
  }

  async function addPlace(data) {
    await createPlaceApi({
      block_id: data.blockId,
      code: data.code,
      name: data.name || null,
      description: data.notes || data.description || null,
      surface: data.surface,
      type: data.type || data.category || 'STANDARD',
      status: data.status || 'AVAILABLE',
    });
  }

  async function updatePlace(id, data) {
    await updatePlaceApi(id, {
      block_id: data.blockId,
      code: data.code,
      name: data.name || null,
      description: data.notes || data.description || null,
      surface: data.surface,
      type: data.type || data.category || 'STANDARD',
      status: data.status || 'AVAILABLE',
    });
  }

  async function deletePlace(id) {
    await deletePlaceApi(id);
  }

  function clear() {
    blocks.value = [];
    places.value = [];
  }

  return {
    blocks,
    places,
    setBlocks,
    setPlaces,
    loadBlocks,
    loadPlaces,
    addBlock,
    updateBlock,
    deleteBlock,
    addPlace,
    updatePlace,
    deletePlace,
    clear,
  };
});
