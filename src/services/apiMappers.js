function titleForRole(roleCode) {
  if (roleCode === 'SUPER_ADMIN') return 'Directeur Général';
  if (roleCode === 'ADMIN') return 'Commissaire du Marché';
  if (roleCode === 'ACCOUNTANT') return 'Chef Comptable';
  return 'Utilisateur';
}

function ensureNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDateString(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function toDateTimeString(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 16);
}

export function mapCurrentUser(user) {
  if (!user) return null;

  const roleCode = user.role?.code || user.role?.name || 'ADMIN';
  return {
    id: user.id,
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    status: user.status || 'ACTIVE',
    role: roleCode,
    roleId: user.role?.id || null,
    title: titleForRole(roleCode),
    permissions: user.permissions || [],
  };
}

export function mapMarket(market, summary = null, settings = []) {
  if (!market) return null;

  const settingMap = Object.fromEntries(
    settings.map((setting) => [setting.key, setting.value])
  );

  return {
    id: market.id,
    code: market.code,
    name: market.name || '',
    description: market.description || '',
    address: market.address || '',
    city: market.commune || settingMap.market_city || '',
    country: market.province || settingMap.market_country || '',
    currency: settingMap.currency_code || 'FBu',
    phone: market.phone || '',
    email: market.email || '',
    logo: market.logo || '',
    status: market.status || 'ACTIVE',
    totalBlocks: summary?.total_blocks ?? 0,
    totalPlaces: summary?.total_places ?? 0,
    managerName: settingMap.market_manager || '',
  };
}

export function mapBlock(block) {
  const derivedCategory =
    (block.name && block.name.includes('-') ? block.name.split('-').slice(1).join('-').trim() : '') ||
    block.description ||
    'Divers';

  return {
    id: block.id,
    marketId: block.market_id || null,
    code: block.code || '',
    name: block.name || '',
    description: block.description || '',
    defaultRentPrice: ensureNumber(block.default_rent_amount),
    status: block.status || 'ACTIVE',
    totalPlaces: block.places_count ?? block.placesCount ?? 0,
    category: derivedCategory,
  };
}

export function mapPlace(place) {
  const block = place.block || {};
  const activeAssignment = Array.isArray(place.assignments)
    ? place.assignments.find((assignment) => assignment.status === 'ACTIVE')
    : null;

  return {
    id: place.id,
    blockId: place.block_id || null,
    blockCode: block.code || place.block_code || '',
    code: place.code || '',
    name: place.name || '',
    description: place.description || '',
    rentPrice: ensureNumber(place.rent_price ?? place.default_rent_amount ?? activeAssignment?.rent_amount),
    category: place.type || '',
    surface: ensureNumber(place.surface),
    status: place.status || 'AVAILABLE',
    currentMerchantId: activeAssignment?.merchant_id || null,
    currentMerchantName: activeAssignment?.merchant?.business_name || activeAssignment?.merchant?.name || '',
    currentAssignmentId: activeAssignment?.id || null,
    notes: place.notes || '',
  };
}

export function mapMerchant(merchant) {
  const activeAssignment = Array.isArray(merchant.assignments)
    ? merchant.assignments.find((assignment) => assignment.status === 'ACTIVE')
    : null;
  const payments = Array.isArray(merchant.payments) ? merchant.payments : [];

  return {
    id: merchant.id,
    merchantCode: merchant.merchant_code || '',
    name: merchant.business_name || merchant.name || '',
    phone: merchant.phone || '',
    cni: merchant.national_id || '',
    category: merchant.business_type || '',
    activity: merchant.business_type || '',
    address: merchant.address || '',
    notes: merchant.notes || '',
    status: merchant.status || 'ACTIVE',
    registrationDate: toDateString(merchant.registration_date),
    currentPlaceCode: activeAssignment?.place?.code || merchant.current_place_code || '',
    currentPlaceId: activeAssignment?.place_id || merchant.current_place_id || null,
    totalPaid: payments.reduce((sum, payment) => sum + ensureNumber(payment.amount), 0),
    balanceDue: ensureNumber(merchant.balance_due ?? merchant.balanceDue),
  };
}

export function mapAssignment(assignment) {
  return {
    id: assignment.id,
    placeId: assignment.place_id || null,
    placeCode: assignment.place?.code || assignment.place_code || '',
    blockCode: assignment.place?.block?.code || assignment.block_code || '',
    merchantId: assignment.merchant_id || null,
    merchantName: assignment.merchant?.business_name || assignment.merchant_name || '',
    startDate: toDateString(assignment.start_date),
    endDate: toDateString(assignment.end_date),
    rentAmount: ensureNumber(assignment.rent_amount),
    status: assignment.status || 'ACTIVE',
    createdBy: assignment.assigned_by || '',
    createdAt: toDateTimeString(assignment.created_at),
    notes: assignment.notes || '',
  };
}

export function mapMovement(movement) {
  return {
    id: movement.id,
    placeId: movement.place_id || null,
    placeCode: movement.place?.code || movement.place_code || '',
    date: toDateString(movement.movement_date),
    type: movement.movement_type || '',
    typeLabel: movement.movement_type || '',
    oldMerchantId: movement.previous_merchant_id || null,
    oldMerchantName: movement.previous_merchant?.business_name || '',
    newMerchantId: movement.new_merchant_id || null,
    newMerchantName: movement.new_merchant?.business_name || '',
    reason: movement.reason || '',
    notes: movement.notes || '',
    executedBy: movement.created_by || '',
    createdAt: toDateTimeString(movement.created_at),
  };
}

export function mapObligation(obligation) {
  return {
    id: obligation.id,
    assignmentId: obligation.assignment_id || null,
    placeId: obligation.place_id || null,
    placeCode: obligation.place?.code || obligation.place_code || '',
    blockCode: obligation.place?.block?.code || obligation.block_code || '',
    merchantId: obligation.merchant_id || null,
    merchantName: obligation.merchant?.business_name || obligation.merchant_name || '',
    periodYear: obligation.period?.year || obligation.period_year || 0,
    periodMonth: obligation.period?.month || obligation.period_month || 0,
    periodLabel: obligation.period?.label || obligation.period_label || '',
    amountExpected: ensureNumber(obligation.amount_expected),
    amountPaid: ensureNumber(obligation.amount_paid),
    balance: ensureNumber(obligation.balance),
    status: obligation.status || 'PENDING',
    dueDate: toDateString(obligation.due_date),
    paidAt: toDateString(obligation.paid_at),
  };
}

export function mapBank(bank) {
  return {
    id: bank.id,
    code: bank.code || '',
    name: bank.name || '',
    accountNumber: bank.account_number || '',
    branch: bank.branch || '',
    contactPerson: bank.account_name || '',
    phone: bank.phone || '',
    totalCollected: ensureNumber(bank.total_collected),
    transactionCount: ensureNumber(bank.payments_count || bank.transaction_count),
    isActive: bank.status === 'ACTIVE',
  };
}

export function mapPayment(payment) {
  const allocations = Array.isArray(payment.allocations) ? payment.allocations : [];
  const firstAllocation = allocations[0]?.obligation || null;

  return {
    id: payment.id,
    receiptNumber: payment.receipt?.receipt_number || payment.reference_number || payment.payment_number || '',
    referenceNumber: payment.reference_number || payment.payment_number || '',
    merchantId: payment.merchant_id || null,
    merchantName: payment.merchant?.business_name || payment.merchant_name || '',
    placeId: firstAllocation?.place_id || null,
    placeCode: firstAllocation?.place?.code || '',
    blockCode: firstAllocation?.place?.block?.code || '',
    obligationId: firstAllocation?.id || null,
    periodYear: firstAllocation?.period?.year || 0,
    periodMonth: firstAllocation?.period?.month || 0,
    periodLabel: firstAllocation?.period?.label || '',
    amount: ensureNumber(payment.amount),
    bankId: payment.bank_id || null,
    bankName: payment.bank?.name || '',
    bankCode: payment.bank?.code || '',
    paymentDate: toDateString(payment.payment_date),
    recordedBy: payment.receiver?.name || '',
    recordedByRole: payment.receiver?.role?.code || '',
    notes: payment.notes || '',
    createdAt: toDateTimeString(payment.created_at),
  };
}

export function mapReceipt(receipt) {
  const payment = receipt.payment || {};
  const allocations = Array.isArray(payment.allocations) ? payment.allocations : [];
  const firstAllocation = allocations[0]?.obligation || null;

  return {
    id: receipt.id,
    paymentId: receipt.payment_id || null,
    receiptNumber: receipt.receipt_number || '',
    receiptDate: toDateString(receipt.receipt_date),
    issuedBy: receipt.issuer?.name || '',
    status: receipt.status || 'VALID',
    documentPath: receipt.document_path || '',
    merchantId: payment.merchant_id || null,
    merchantName: payment.merchant?.business_name || '',
    placeCode: firstAllocation?.place?.code || '',
    blockCode: firstAllocation?.place?.block?.code || '',
    periodLabel: firstAllocation?.period?.label || '',
    amount: ensureNumber(payment.amount),
    bankName: payment.bank?.name || '',
    bankCode: payment.bank?.code || '',
    paymentDate: toDateString(payment.payment_date),
  };
}

export function mapAuditLog(log) {
  return {
    id: log.id,
    timestamp: toDateTimeString(log.created_at),
    userName: log.user?.name || '',
    userRole: log.user?.role?.code || '',
    action: log.action || '',
    actionLabel: log.action || '',
    targetId: String(log.entity_id || ''),
    details: log.new_values ? JSON.stringify(log.new_values) : '',
    amount: null,
    bank: null,
  };
}
