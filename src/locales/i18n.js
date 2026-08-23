const messages = {
  fr: {
    appName: 'MarketManager',
    loading: 'Chargement du tableau de bord...',
    reset: 'Réinitialiser les données locales',
  },
};

let currentLocale = 'fr';

export function setLocale(locale) {
  currentLocale = messages[locale] ? locale : 'fr';
}

export function getLocale() {
  return currentLocale;
}

export function t(key) {
  return messages[currentLocale]?.[key] || key;
}
