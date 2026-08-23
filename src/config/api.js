const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export const ROUTES = [
  { path: '/', tab: 'dashboard-super', label: 'Vue Globale', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], showInSidebar: false },
  { path: '/dashboard', tab: 'dashboard-super', label: 'Vue Globale', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], showInSidebar: true },
  { path: '/dashboard/admin', tab: 'dashboard-admin', label: 'Gestion Opérationnelle', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/dashboard/accounting', tab: 'dashboard-accountant', label: 'Finance & Caisse', roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
  { path: '/dashboard/occupancy', tab: 'dashboard-occupancy', label: 'Plan 2D & Occupation', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/structure/blocks', tab: 'structure-blocks', label: 'Blocs & Tarifs', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/structure/places', tab: 'structure-places', label: 'Places du Marché', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/merchants', tab: 'merchants-list', label: 'Commerçants', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/merchants/assignments', tab: 'merchants-assignments', label: 'Affectations Actives', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/merchants/movements', tab: 'merchants-movements', label: 'Mouvements & Historique', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/finances/rents', tab: 'finances-rents', label: 'Loyers & Reçus', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/finances/payments', tab: 'finances-payments', label: 'Journal Paiements', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/finances/banks', tab: 'finances-banks', label: 'Analyse Banques', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/tools/excel', tab: 'tools-excel', label: 'Import / Export Excel', roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/tools/audit', tab: 'tools-audit', label: "Journal d'Audit", roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { path: '/admin/users', tab: 'admin-users', label: 'Utilisateurs & Rôles', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/admin/settings', tab: 'admin-settings', label: 'Paramètres Marché', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export const TAB_TO_PATH = Object.fromEntries(ROUTES.map((route) => [route.tab, route.path]));
export const PATH_TO_TAB = Object.fromEntries(ROUTES.map((route) => [route.path, route.tab]));

export const ROLE_DEFAULT_TAB = {
  SUPER_ADMIN: 'dashboard-super',
  ADMIN: 'dashboard-admin',
  ACCOUNTANT: 'dashboard-accountant',
};

const initialState = {
  currentUser: {
    id: 'usr-1',
    name: 'Patrice Ndayishimiye',
    email: 'direction@marchebujumbura.bi',
    role: 'SUPER_ADMIN',
    title: 'Directeur Général',
    phone: '+257 79 123 456',
  },
  activeTab: 'dashboard-super',
  sidebarCollapsed: false,
  market: {
    id: 'mkt-01',
    name: 'Grand Marché Central de Bujumbura',
    city: 'Bujumbura',
    country: 'Burundi',
    currency: 'FBu',
    totalBlocks: 4,
    totalPlaces: 12,
    managerName: 'Patrice Ndayishimiye',
    address: 'Avenue du Port, Centre-Ville',
    phone: '+257 22 22 00 01',
  },
  users: [
    {
      id: 'usr-1',
      name: 'Patrice Ndayishimiye',
      email: 'direction@marchebujumbura.bi',
      role: 'SUPER_ADMIN',
      title: 'Directeur Général',
      phone: '+257 79 123 456',
    },
    {
      id: 'usr-2',
      name: 'Clotilde Habonimana',
      email: 'commissaire@marchebujumbura.bi',
      role: 'ADMIN',
      title: 'Commissaire du Marché',
      phone: '+257 71 987 654',
    },
    {
      id: 'usr-3',
      name: 'Alexis Hakizimana',
      email: 'comptabilite@marchebujumbura.bi',
      role: 'ACCOUNTANT',
      title: 'Chef Comptable',
      phone: '+257 76 555 444',
    },
  ],
  blocks: [
    { id: 'blk-a', marketId: 'mkt-01', code: 'Bloc A', name: 'Bloc A - Alimentaire', defaultRentPrice: 50000, description: 'Fruits, légumes et vivres.', category: 'Alimentaire', totalPlaces: 3 },
    { id: 'blk-b', marketId: 'mkt-01', code: 'Bloc B', name: 'Bloc B - Textile', defaultRentPrice: 75000, description: 'Textiles et habillement.', category: 'Textile', totalPlaces: 3 },
    { id: 'blk-c', marketId: 'mkt-01', code: 'Bloc C', name: 'Bloc C - Électronique', defaultRentPrice: 100000, description: 'Électronique et quincaillerie.', category: 'Électronique', totalPlaces: 3 },
    { id: 'blk-d', marketId: 'mkt-01', code: 'Bloc D', name: 'Bloc D - Beauté & Artisanat', defaultRentPrice: 60000, description: 'Cosmétiques et artisanat.', category: 'Artisanat', totalPlaces: 3 },
  ],
  places: [
    { id: 'plc-a-001', blockId: 'blk-a', blockCode: 'Bloc A', code: 'A-001', rentPrice: 50000, category: 'Alimentaire', surface: 6, status: 'OCCUPIED', currentMerchantId: 'mer-02', currentMerchantName: 'Marie Claire Ndikumana', currentAssignmentId: 'asg-a-001' },
    { id: 'plc-a-002', blockId: 'blk-a', blockCode: 'Bloc A', code: 'A-002', rentPrice: 50000, category: 'Alimentaire', surface: 6, status: 'OCCUPIED', currentMerchantId: 'mer-01', currentMerchantName: 'Jean Nininahazwe', currentAssignmentId: 'asg-a-002' },
    { id: 'plc-a-003', blockId: 'blk-a', blockCode: 'Bloc A', code: 'A-003', rentPrice: 50000, category: 'Alimentaire', surface: 6, status: 'AVAILABLE' },
    { id: 'plc-b-001', blockId: 'blk-b', blockCode: 'Bloc B', code: 'B-001', rentPrice: 75000, category: 'Textile', surface: 8, status: 'OCCUPIED', currentMerchantId: 'mer-11', currentMerchantName: 'Pasteur Bizimana', currentAssignmentId: 'asg-b-001' },
    { id: 'plc-b-002', blockId: 'blk-b', blockCode: 'Bloc B', code: 'B-002', rentPrice: 75000, category: 'Textile', surface: 8, status: 'OCCUPIED', currentMerchantId: 'mer-12', currentMerchantName: 'Solange Gahimbare', currentAssignmentId: 'asg-b-002' },
    { id: 'plc-b-003', blockId: 'blk-b', blockCode: 'Bloc B', code: 'B-003', rentPrice: 75000, category: 'Textile', surface: 8, status: 'MAINTENANCE', notes: 'Réfection des étagères' },
    { id: 'plc-c-001', blockId: 'blk-c', blockCode: 'Bloc C', code: 'C-001', rentPrice: 100000, category: 'Électronique', surface: 10, status: 'OCCUPIED', currentMerchantId: 'mer-19', currentMerchantName: 'Prosper Ntirampeba', currentAssignmentId: 'asg-c-001' },
    { id: 'plc-c-002', blockId: 'blk-c', blockCode: 'Bloc C', code: 'C-002', rentPrice: 100000, category: 'Électronique', surface: 10, status: 'OCCUPIED', currentMerchantId: 'mer-20', currentMerchantName: 'René Nkeshimana', currentAssignmentId: 'asg-c-002' },
    { id: 'plc-c-003', blockId: 'blk-c', blockCode: 'Bloc C', code: 'C-003', rentPrice: 100000, category: 'Électronique', surface: 10, status: 'AVAILABLE' },
    { id: 'plc-d-001', blockId: 'blk-d', blockCode: 'Bloc D', code: 'D-001', rentPrice: 60000, category: 'Artisanat', surface: 7, status: 'OCCUPIED', currentMerchantId: 'mer-24', currentMerchantName: 'Lambert Nsabimana', currentAssignmentId: 'asg-d-001' },
    { id: 'plc-d-002', blockId: 'blk-d', blockCode: 'Bloc D', code: 'D-002', rentPrice: 60000, category: 'Artisanat', surface: 7, status: 'OCCUPIED', currentMerchantId: 'mer-25', currentMerchantName: 'Yvette Nzigamasabo', currentAssignmentId: 'asg-d-002' },
    { id: 'plc-d-003', blockId: 'blk-d', blockCode: 'Bloc D', code: 'D-003', rentPrice: 60000, category: 'Artisanat', surface: 7, status: 'AVAILABLE' },
  ],
  merchants: [
    { id: 'mer-01', name: 'Jean Nininahazwe', phone: '+257 79 401 202', cni: 'CNI-110/8932/BUJ', category: 'Alimentaire', status: 'ACTIVE', registrationDate: '2025-11-15', currentPlaceCode: 'A-002', currentPlaceId: 'plc-a-002', totalPaid: 400000, balanceDue: 0 },
    { id: 'mer-02', name: 'Marie Claire Ndikumana', phone: '+257 71 550 889', cni: 'CNI-110/4451/BUJ', category: 'Alimentaire', status: 'ACTIVE', registrationDate: '2026-01-05', currentPlaceCode: 'A-001', currentPlaceId: 'plc-a-001', totalPaid: 300000, balanceDue: 50000 },
    { id: 'mer-11', name: 'Pasteur Bizimana', phone: '+257 71 772 334', cni: 'CNI-110/9982/BUJ', category: 'Textile', status: 'ACTIVE', registrationDate: '2026-01-01', currentPlaceCode: 'B-001', currentPlaceId: 'plc-b-001', totalPaid: 600000, balanceDue: 0 },
    { id: 'mer-12', name: 'Solange Gahimbare', phone: '+257 76 112 998', cni: 'CNI-110/7765/BUJ', category: 'Textile', status: 'ACTIVE', registrationDate: '2026-01-01', currentPlaceCode: 'B-002', currentPlaceId: 'plc-b-002', totalPaid: 525000, balanceDue: 75000 },
    { id: 'mer-19', name: 'Prosper Ntirampeba', phone: '+257 79 559 881', cni: 'CNI-110/1182/BUJ', category: 'Électronique', status: 'ACTIVE', registrationDate: '2026-01-01', currentPlaceCode: 'C-001', currentPlaceId: 'plc-c-001', totalPaid: 800000, balanceDue: 0 },
    { id: 'mer-20', name: 'René Nkeshimana', phone: '+257 71 229 004', cni: 'CNI-110/9924/BUJ', category: 'Électronique', status: 'ACTIVE', registrationDate: '2026-01-01', currentPlaceCode: 'C-002', currentPlaceId: 'plc-c-002', totalPaid: 800000, balanceDue: 0 },
    { id: 'mer-24', name: 'Lambert Nsabimana', phone: '+257 76 990 117', cni: 'CNI-110/8845/BUJ', category: 'Artisanat', status: 'ACTIVE', registrationDate: '2026-01-01', currentPlaceCode: 'D-001', currentPlaceId: 'plc-d-001', totalPaid: 480000, balanceDue: 0 },
    { id: 'mer-25', name: 'Yvette Nzigamasabo', phone: '+257 79 119 443', cni: 'CNI-110/3314/BUJ', category: 'Artisanat', status: 'ACTIVE', registrationDate: '2026-01-01', currentPlaceCode: 'D-002', currentPlaceId: 'plc-d-002', totalPaid: 480000, balanceDue: 0 },
    { id: 'mer-09', name: 'Bonaventure Nshimirimana', phone: '+257 76 443 891', cni: 'CNI-110/5541/BUJ', category: 'Alimentaire', status: 'INACTIVE', registrationDate: '2025-10-01', totalPaid: 250000, balanceDue: 0 },
  ],
  assignments: [
    { id: 'asg-a-001', placeId: 'plc-a-001', placeCode: 'A-001', blockCode: 'Bloc A', merchantId: 'mer-02', merchantName: 'Marie Claire Ndikumana', startDate: '2026-01-01', rentAmount: 50000, status: 'ACTIVE', createdBy: 'Clotilde Habonimana', createdAt: '2026-01-01 08:00' },
    { id: 'asg-a-002', placeId: 'plc-a-002', placeCode: 'A-002', blockCode: 'Bloc A', merchantId: 'mer-01', merchantName: 'Jean Nininahazwe', startDate: '2026-01-01', rentAmount: 50000, status: 'ACTIVE', createdBy: 'Clotilde Habonimana', createdAt: '2026-01-01 08:00' },
    { id: 'asg-b-001', placeId: 'plc-b-001', placeCode: 'B-001', blockCode: 'Bloc B', merchantId: 'mer-11', merchantName: 'Pasteur Bizimana', startDate: '2026-01-01', rentAmount: 75000, status: 'ACTIVE', createdBy: 'Clotilde Habonimana', createdAt: '2026-01-01 08:30' },
    { id: 'asg-b-002', placeId: 'plc-b-002', placeCode: 'B-002', blockCode: 'Bloc B', merchantId: 'mer-12', merchantName: 'Solange Gahimbare', startDate: '2026-01-01', rentAmount: 75000, status: 'ACTIVE', createdBy: 'Clotilde Habonimana', createdAt: '2026-01-01 08:30' },
    { id: 'asg-c-001', placeId: 'plc-c-001', placeCode: 'C-001', blockCode: 'Bloc C', merchantId: 'mer-19', merchantName: 'Prosper Ntirampeba', startDate: '2026-01-01', rentAmount: 100000, status: 'ACTIVE', createdBy: 'Clotilde Habonimana', createdAt: '2026-01-01 09:00' },
    { id: 'asg-c-002', placeId: 'plc-c-002', placeCode: 'C-002', blockCode: 'Bloc C', merchantId: 'mer-20', merchantName: 'René Nkeshimana', startDate: '2026-01-01', rentAmount: 100000, status: 'ACTIVE', createdBy: 'Clotilde Habonimana', createdAt: '2026-01-01 09:00' },
    { id: 'asg-d-001', placeId: 'plc-d-001', placeCode: 'D-001', blockCode: 'Bloc D', merchantId: 'mer-24', merchantName: 'Lambert Nsabimana', startDate: '2026-01-01', rentAmount: 60000, status: 'ACTIVE', createdBy: 'Clotilde Habonimana', createdAt: '2026-01-01 09:30' },
    { id: 'asg-d-002', placeId: 'plc-d-002', placeCode: 'D-002', blockCode: 'Bloc D', merchantId: 'mer-25', merchantName: 'Yvette Nzigamasabo', startDate: '2026-01-01', rentAmount: 60000, status: 'ACTIVE', createdBy: 'Clotilde Habonimana', createdAt: '2026-01-01 09:30' },
  ],
  movements: [
    { id: 'mov-001', placeId: 'plc-a-001', placeCode: 'A-001', date: '2026-01-01', type: 'ENTRY', typeLabel: 'Entrée initiale', newMerchantId: 'mer-02', newMerchantName: 'Marie Claire Ndikumana', reason: 'Attribution initiale', executedBy: 'Clotilde Habonimana', createdAt: '2026-01-01 08:00' },
    { id: 'mov-002', placeId: 'plc-a-002', placeCode: 'A-002', date: '2026-01-01', type: 'ENTRY', typeLabel: 'Entrée initiale', newMerchantId: 'mer-01', newMerchantName: 'Jean Nininahazwe', reason: 'Attribution initiale', executedBy: 'Clotilde Habonimana', createdAt: '2026-01-01 08:00' },
    { id: 'mov-003', placeId: 'plc-b-001', placeCode: 'B-001', date: '2026-01-01', type: 'ENTRY', typeLabel: 'Entrée initiale', newMerchantId: 'mer-11', newMerchantName: 'Pasteur Bizimana', reason: 'Attribution initiale', executedBy: 'Clotilde Habonimana', createdAt: '2026-01-01 08:30' },
    { id: 'mov-004', placeId: 'plc-d-001', placeCode: 'D-001', date: '2026-01-01', type: 'ENTRY', typeLabel: 'Entrée initiale', newMerchantId: 'mer-24', newMerchantName: 'Lambert Nsabimana', reason: 'Attribution initiale', executedBy: 'Clotilde Habonimana', createdAt: '2026-01-01 09:30' },
  ],
  obligations: [
    { id: 'obl-asg-a-001-2026-07', assignmentId: 'asg-a-001', placeId: 'plc-a-001', placeCode: 'A-001', blockCode: 'Bloc A', merchantId: 'mer-02', merchantName: 'Marie Claire Ndikumana', periodYear: 2026, periodMonth: 7, periodLabel: 'Juillet 2026', amountExpected: 50000, amountPaid: 0, balance: 50000, status: 'OVERDUE', dueDate: '2026-07-10' },
    { id: 'obl-asg-a-001-2026-08', assignmentId: 'asg-a-001', placeId: 'plc-a-001', placeCode: 'A-001', blockCode: 'Bloc A', merchantId: 'mer-02', merchantName: 'Marie Claire Ndikumana', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amountExpected: 50000, amountPaid: 0, balance: 50000, status: 'PENDING', dueDate: '2026-08-10' },
    { id: 'obl-asg-a-002-2026-08', assignmentId: 'asg-a-002', placeId: 'plc-a-002', placeCode: 'A-002', blockCode: 'Bloc A', merchantId: 'mer-01', merchantName: 'Jean Nininahazwe', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amountExpected: 50000, amountPaid: 50000, balance: 0, status: 'PAID', dueDate: '2026-08-10', paidAt: '2026-08-08' },
    { id: 'obl-asg-b-002-2026-08', assignmentId: 'asg-b-002', placeId: 'plc-b-002', placeCode: 'B-002', blockCode: 'Bloc B', merchantId: 'mer-12', merchantName: 'Solange Gahimbare', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amountExpected: 75000, amountPaid: 0, balance: 75000, status: 'PENDING', dueDate: '2026-08-10' },
    { id: 'obl-asg-c-001-2026-08', assignmentId: 'asg-c-001', placeId: 'plc-c-001', placeCode: 'C-001', blockCode: 'Bloc C', merchantId: 'mer-19', merchantName: 'Prosper Ntirampeba', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amountExpected: 100000, amountPaid: 100000, balance: 0, status: 'PAID', dueDate: '2026-08-10', paidAt: '2026-08-06' },
    { id: 'obl-asg-d-001-2026-08', assignmentId: 'asg-d-001', placeId: 'plc-d-001', placeCode: 'D-001', blockCode: 'Bloc D', merchantId: 'mer-24', merchantName: 'Lambert Nsabimana', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amountExpected: 60000, amountPaid: 60000, balance: 0, status: 'PAID', dueDate: '2026-08-10', paidAt: '2026-08-07' },
    { id: 'obl-asg-d-002-2026-08', assignmentId: 'asg-d-002', placeId: 'plc-d-002', placeCode: 'D-002', blockCode: 'Bloc D', merchantId: 'mer-25', merchantName: 'Yvette Nzigamasabo', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amountExpected: 60000, amountPaid: 30000, balance: 30000, status: 'PARTIAL', dueDate: '2026-08-10', paidAt: '2026-08-09' },
  ],
  banks: [
    { id: 'bank-1', code: 'BANCOBU', name: 'Banque Commerciale du Burundi', accountNumber: '00100-345892-01', branch: 'Centre-Ville', contactPerson: 'Agence Centrale', phone: '+257 22 22 23 17', totalCollected: 2450000, transactionCount: 24, isActive: true },
    { id: 'bank-2', code: 'CRDB', name: 'CRDB Bank Burundi', accountNumber: '0250-983411-09', branch: 'Rohero', contactPerson: 'Agence Rohero', phone: '+257 22 27 77 00', totalCollected: 1680000, transactionCount: 16, isActive: true },
    { id: 'bank-3', code: 'BIL', name: 'Bujumbura International Bank', accountNumber: '0100-445678-88', branch: 'Asiatique', contactPerson: 'Agence Asiatique', phone: '+257 22 22 21 00', totalCollected: 940000, transactionCount: 9, isActive: true },
  ],
  payments: [
    { id: 'pay-001', receiptNumber: 'REC-2026-000145', referenceNumber: 'REC-2026-000145', merchantId: 'mer-01', merchantName: 'Jean Nininahazwe', placeId: 'plc-a-002', placeCode: 'A-002', blockCode: 'Bloc A', obligationId: 'obl-asg-a-002-2026-08', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amount: 50000, bankId: 'bank-1', bankName: 'Banque Commerciale du Burundi', bankCode: 'BANCOBU', paymentDate: '2026-08-16', recordedBy: 'Alexis Hakizimana', recordedByRole: 'ACCOUNTANT', notes: 'Loyer mensuel Août 2026 encaissé au guichet', createdAt: '2026-08-16 10:42' },
    { id: 'pay-002', receiptNumber: 'REC-2026-000144', referenceNumber: 'REC-2026-000144', merchantId: 'mer-11', merchantName: 'Pasteur Bizimana', placeId: 'plc-b-001', placeCode: 'B-001', blockCode: 'Bloc B', obligationId: 'obl-asg-b-002-2026-08', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amount: 75000, bankId: 'bank-2', bankName: 'CRDB Bank Burundi', bankCode: 'CRDB', paymentDate: '2026-08-14', recordedBy: 'Alexis Hakizimana', recordedByRole: 'ACCOUNTANT', notes: 'Reçu caisse', createdAt: '2026-08-14 09:15' },
    { id: 'pay-003', receiptNumber: 'REC-2026-000143', referenceNumber: 'REC-2026-000143', merchantId: 'mer-19', merchantName: 'Prosper Ntirampeba', placeId: 'plc-c-001', placeCode: 'C-001', blockCode: 'Bloc C', obligationId: 'obl-asg-c-001-2026-08', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amount: 100000, bankId: 'bank-1', bankName: 'Banque Commerciale du Burundi', bankCode: 'BANCOBU', paymentDate: '2026-08-06', recordedBy: 'Alexis Hakizimana', recordedByRole: 'ACCOUNTANT', notes: 'Versement agence centrale', createdAt: '2026-08-06 11:20' },
    { id: 'pay-004', receiptNumber: 'REC-2026-000142', referenceNumber: 'REC-2026-000142', merchantId: 'mer-24', merchantName: 'Lambert Nsabimana', placeId: 'plc-d-001', placeCode: 'D-001', blockCode: 'Bloc D', obligationId: 'obl-asg-d-001-2026-08', periodYear: 2026, periodMonth: 8, periodLabel: 'Août 2026', amount: 60000, bankId: 'bank-3', bankName: 'Bujumbura International Bank', bankCode: 'BIL', paymentDate: '2026-08-07', recordedBy: 'Alexis Hakizimana', recordedByRole: 'ACCOUNTANT', notes: 'Encaissement caisse', createdAt: '2026-08-07 13:05' },
  ],
  auditLogs: [
    { id: 'log-001', timestamp: '2026-08-16 10:42', userName: 'Alexis Hakizimana', userRole: 'ACCOUNTANT', action: 'PAYMENT_CREATED', actionLabel: 'Paiement Enregistré', targetId: 'REC-2026-000145', details: 'Reçu loyer Août 2026 pour Jean Nininahazwe (A-002).', amount: 50000, bank: 'BANCOBU' },
    { id: 'log-002', timestamp: '2026-08-15 14:20', userName: 'Clotilde Habonimana', userRole: 'ADMIN', action: 'ASSIGNMENT_CREATED', actionLabel: 'Affectation Place', targetId: 'A-001', details: 'Affectation de la place A-001 à Marie Claire Ndikumana.', amount: 50000 },
    { id: 'log-003', timestamp: '2026-08-14 09:15', userName: 'Alexis Hakizimana', userRole: 'ACCOUNTANT', action: 'PAYMENT_CREATED', actionLabel: 'Paiement Enregistré', targetId: 'REC-2026-000144', details: 'Paiement au guichet pour Pasteur Bizimana (B-001).', amount: 75000, bank: 'CRDB' },
    { id: 'log-004', timestamp: '2026-08-10 11:00', userName: 'Patrice Ndayishimiye', userRole: 'SUPER_ADMIN', action: 'DATA_IMPORTED', actionLabel: 'Configuration Marché', targetId: 'mkt-01', details: 'Mise à jour de la configuration générale du marché.' },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getSeedState() {
  return clone(initialState);
}

export function getTabFromPath(pathname) {
  return PATH_TO_TAB[pathname] || 'dashboard-super';
}

export function getPathFromTab(tab) {
  return TAB_TO_PATH[tab] || '/';
}

export function getVisibleRoutes(role) {
  return ROUTES.filter((route) => route.roles.includes(role) && route.showInSidebar !== false);
}

export function getDefaultTabForRole(role) {
  return ROLE_DEFAULT_TAB[role] || 'dashboard-super';
}

export function getRouteLabel(tab) {
  return ROUTES.find((route) => route.tab === tab)?.label || 'Vue Globale';
}

export function getMonthNames() {
  return monthNames.slice();
}
