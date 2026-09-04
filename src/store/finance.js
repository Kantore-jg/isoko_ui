import { ref } from 'vue';
import { defineStore } from 'pinia';
import { downloadBlob } from '../services/apiClient.js';
import {
  cancelReceiptApi,
  createBankApi,
  createPaymentApi,
  deleteBankApi,
  exportExcelApi,
  importExcelApi,
  listBanksApi,
  listPaymentsApi,
  listReceiptsApi,
  listApi,
  templateExcelApi,
  updateBankApi,
  voidPaymentApi,
} from '../services/marketApi.js';
import { mapBank, mapObligation, mapPayment, mapReceipt } from '../services/apiMappers.js';

export const useFinanceStore = defineStore('finance', () => {
  const obligations = ref([]);
  const banks = ref([]);
  const payments = ref([]);
  const receipts = ref([]);

  function setObligations(data) {
    obligations.value = data;
  }

  function setBanks(data) {
    banks.value = data;
  }

  function setPayments(data) {
    payments.value = data;
  }

  function setReceipts(data) {
    receipts.value = data;
  }

  async function loadObligations() {
    const response = await listApi('rent-obligations', { per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    obligations.value = data.map(mapObligation);
    return obligations.value;
  }

  async function loadBanks() {
    const response = await listBanksApi({ per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    banks.value = data.map(mapBank);
    return banks.value;
  }

  async function loadPayments() {
    const response = await listPaymentsApi({ per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    payments.value = data.map(mapPayment);
    return payments.value;
  }

  async function loadReceipts() {
    const response = await listReceiptsApi({ per_page: 1000 });
    const data = Array.isArray(response) ? response : response?.data || [];
    receipts.value = data.map(mapReceipt);
    return receipts.value;
  }

  async function addBank(data) {
    await createBankApi({
      code: data.code,
      name: data.name,
      account_name: data.accountName || data.contactPerson || '',
      account_number: data.accountNumber,
      branch: data.branch,
      description: data.description || '',
      status: data.isActive === false ? 'INACTIVE' : 'ACTIVE',
    });
  }

  async function updateBank(id, data) {
    await updateBankApi(id, {
      code: data.code,
      name: data.name,
      account_name: data.accountName || data.contactPerson || '',
      account_number: data.accountNumber,
      branch: data.branch,
      description: data.description || '',
      status: data.isActive === false ? 'INACTIVE' : 'ACTIVE',
    });
  }

  async function deleteBank(id) {
    await deleteBankApi(id);
  }

  async function recordPayment(data) {
    const payload = {
      merchant_id: data.merchantId,
      payment_date: data.paymentDate,
      amount: data.amount,
      bank_id: data.bankId,
      reference_number: data.referenceNumber,
      payment_method: data.paymentMethod || 'CASH',
      notes: data.notes || '',
      auto_allocate: data.autoAllocate ?? true,
      as_of_date: data.asOfDate || data.paymentDate,
      allocations: data.allocations?.length ? data.allocations : undefined,
    };
    if (data.periodYear) payload.period_year = data.periodYear;
    if (data.periodMonth) payload.period_month = data.periodMonth;
    const response = await createPaymentApi(payload);
    return mapPayment(response.data || {});
  }

  async function voidPayment(paymentId, reason) {
    await voidPaymentApi(paymentId, { void_reason: reason });
  }

  async function cancelReceipt(receiptId, reason = '') {
    await cancelReceiptApi(receiptId, { reason });
  }

  function excelFileName(kind, scope) {
    const date = new Date().toISOString().slice(0, 10);
    return `market-${kind}-${scope}-${date}.xlsx`;
  }

  async function exportExcel(scope = 'all') {
    const blob = await exportExcelApi(scope);
    downloadBlob(blob, excelFileName('export', scope));
  }

  async function downloadTemplate(scope = 'all') {
    const blob = await templateExcelApi(scope);
    downloadBlob(blob, excelFileName('template', scope));
  }

  async function importExcel(file, scope = 'all') {
    const response = await importExcelApi(file, scope);
    return response;
  }

  function clear() {
    obligations.value = [];
    banks.value = [];
    payments.value = [];
    receipts.value = [];
  }

  return {
    obligations,
    banks,
    payments,
    receipts,
    setObligations,
    setBanks,
    setPayments,
    setReceipts,
    loadObligations,
    loadBanks,
    loadPayments,
    loadReceipts,
    addBank,
    updateBank,
    deleteBank,
    recordPayment,
    voidPayment,
    cancelReceipt,
    exportExcel,
    downloadTemplate,
    importExcel,
    clear,
  };
});
