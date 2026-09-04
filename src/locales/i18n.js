import { reactive } from 'vue';

const messages = {
  fr: {
    // App
    appName: 'MarketManager',
    loading: 'Chargement du tableau de bord...',
    reset: 'Réinitialiser les données locales',

    // Auth
    login: 'Connexion',
    logout: 'Déconnexion',
    username: "Nom d'utilisateur",
    password: 'Mot de passe',
    loginButton: 'Se connecter',
    loginError: 'Identifiants incorrects.',
    sessionExpired: 'Session expirée. Veuillez vous reconnecter.',

    // Navigation & Layout
    sidebar: 'Menu latéral',
    notifications: 'Notifications',
    profile: 'Profil',
    search: 'Rechercher...',
    noResults: 'Aucun résultat trouvé.',
    close: 'Fermer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    create: 'Créer',
    add: 'Ajouter',
    back: 'Retour',
    actions: 'Actions',
    details: 'Détails',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    all: 'Tout',

    // Roles
    roleSuperAdmin: 'Directeur Général',
    roleAdmin: 'Commissaire du Marché',
    roleAccountant: 'Chef Comptable',
    roleUser: 'Utilisateur',

    // Dashboard
    dashboardGlobal: 'Vue Globale',
    dashboardAdmin: 'Gestion Opérationnelle',
    dashboardAccountant: 'Finance & Caisse',
    dashboardOccupancy: 'Plan 2D & Occupation',
    occupancyRate: "Taux d'occupation",
    expectedRevenue: 'Revenus attendus',
    obtainedRevenue: 'Revenus obtenus',
    unpaidAmount: 'Montant impayé',
    recoveryRate: 'Taux de recouvrement',
    monthlyTrends: 'Tendances mensuelles',

    // Structure
    blocks: 'Blocs',
    block: 'Bloc',
    places: 'Places',
    place: 'Place',
    rentRates: 'Tarifs de Loyer',
    code: 'Code',
    name: 'Nom',
    description: 'Description',
    defaultRentPrice: 'Loyer par défaut',
    surface: 'Surface',
    type: 'Type',
    category: 'Catégorie',
    blockCreated: 'Bloc créé avec succès.',
    blockUpdated: 'Bloc mis à jour.',
    blockDeleted: 'Bloc supprimé.',
    placeCreated: 'Place créée avec succès.',
    placeUpdated: 'Place mise à jour.',
    placeDeleted: 'Place supprimée.',
    cannotDeleteBlockWithPlaces: 'Impossible de supprimer un bloc qui contient encore des places.',
    cannotDeleteOccupiedPlace: 'Impossible de supprimer une place occupée.',

    // Place types
    typeStandard: 'Standard',
    typeKiosk: 'Kiosque',
    typeBoutique: 'Boutique',
    typeStall: 'Étal',
    typeWarehouse: 'Entrepôt',
    typeOther: 'Autre',

    // Place statuses
    statusAvailable: 'Disponible',
    statusOccupied: 'Occupée',
    statusMaintenance: 'Maintenance',
    statusInactive: 'Inactive',

    // Merchants
    merchants: 'Commerçants',
    merchant: 'Commerçant',
    businessName: 'Nom commercial',
    ownerName: 'Propriétaire',
    phone: 'Téléphone',
    email: 'Email',
    address: 'Adresse',
    activity: "Type d'activité",
    cni: 'CNI / Pièce d\'identité',
    registrationDate: "Date d'inscription",
    merchantCreated: 'Commerçant créé avec succès.',
    merchantUpdated: 'Commerçant mis à jour.',
    merchantDeleted: 'Commerçant supprimé.',

    // Merchant statuses
    merchantActive: 'Actif',
    merchantInactive: 'Inactif',
    merchantSuspended: 'Suspendu',
    merchantClosed: 'Fermé',

    // Assignments
    assignments: 'Affectations',
    assignment: 'Affectation',
    assignPlace: 'Affecter une place',
    terminateAssignment: 'Terminer l\'affectation',
    transfer: 'Mutation',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    rentAmount: 'Montant du loyer',
    reason: 'Motif',
    assignmentCreated: 'Affectation créée avec succès.',
    assignmentTerminated: 'Affectation terminée.',
    overlapDetected: 'Chevauchement détecté pour cette place.',

    // Movements
    movements: 'Mouvements',
    movement: 'Mouvement',
    movementEntry: 'Entrée',
    movementExit: 'Sortie',
    movementTransfer: 'Mutation',
    movementReassignment: 'Réaffectation',
    movementTemporaryExit: 'Sortie temporaire',
    movementReturn: 'Retour',

    // Finance
    obligations: 'Obligations de loyer',
    obligation: 'Obligation',
    payments: 'Paiements',
    payment: 'Paiement',
    banks: 'Banques',
    bank: 'Banque',
    receipts: 'Reçus',
    receipt: 'Reçu',
    amountExpected: 'Montant attendu',
    amountPaid: 'Montant payé',
    balance: 'Solde restant',
    dueDate: "Date d'échéance",
    paymentDate: 'Date de paiement',
    amount: 'Montant',
    referenceNumber: 'N° Référence',
    bankName: 'Banque',
    receiptNumber: 'N° Reçu',

    // Payment statuses
    paymentDraft: 'Brouillon',
    paymentPosted: 'Validé',
    paymentVoided: 'Annulé',

    // Obligation statuses
    obligationPending: 'En attente',
    obligationPartial: 'Partiel',
    obligationPaid: 'Payé',
    obligationOverdue: 'En retard',
    obligationCancelled: 'Annulé',

    // Payment actions
    recordPayment: 'Enregistrer un paiement',
    voidPayment: 'Annuler le paiement',
    voidReason: "Motif d'annulation",
    cancelReceipt: 'Annuler le reçu',
    paymentRecorded: 'Paiement enregistré.',
    paymentVoidedMsg: 'Paiement annulé.',

    // Excel
    importExcel: 'Importer Excel',
    exportExcel: 'Exporter Excel',
    downloadTemplate: 'Télécharger le modèle',
    importSuccess: 'Import terminé avec succès.',
    importError: "Erreur lors de l'import.",

    // Admin
    users: 'Utilisateurs',
    user: 'Utilisateur',
    roles: 'Rôles',
    role: 'Rôle',
    permissions: 'Permissions',
    permission: 'Permission',
    settings: 'Paramètres',
    auditLog: "Journal d'audit",
    currency: 'Devise',
    receiptPrefix: 'Préfixe des reçus',
    marketName: 'Nom du marché',

    // Data states
    loadingData: 'Chargement des données...',
    errorLoading: 'Erreur lors du chargement.',
    noData: 'Aucune donnée disponible.',
    retry: 'Réessayer',

    // Time
    months: [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ],

    // Pagination
    previous: 'Précédent',
    next: 'Suivant',
    page: 'Page',
    of: 'sur',
    showing: 'Affichage de',
    to: 'à',
    entries: 'entrées',
  },
};

const i18nState = reactive({
  locale: 'fr',
});

export function setLocale(locale) {
  i18nState.locale = messages[locale] ? locale : 'fr';
}

export function getLocale() {
  return i18nState.locale;
}

/**
 * Traduit une clé. Supporte les chemins imbriqués avec `.` (ex: 'months.0').
 * @param {string} key
 * @param {Object} [params] - Paramètres de remplacement {name} → params.name
 * @returns {string}
 */
export function t(key, params = {}) {
  const dict = messages[i18nState.locale] || messages.fr;

  let value = key.split('.').reduce((obj, k) => {
    if (obj === null || obj === undefined) return undefined;
    return obj[k];
  }, dict);

  if (value === undefined) return key;
  if (typeof value !== 'string') return String(value);

  return value.replace(/\{(\w+)\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`
  );
}

/**
 * Plugin Vue pour accéder à $t() dans les templates.
 */
export const i18nPlugin = {
  install(app) {
    app.config.globalProperties.$t = t;
    app.provide('i18n', { t, setLocale, getLocale });
  },
};
