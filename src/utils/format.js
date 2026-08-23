export function formatCurrency(value, currency = 'FBu') {
  return `${new Intl.NumberFormat('fr-FR').format(value || 0)} ${currency}`;
}

export function abbreviateRole(role) {
  if (role === 'SUPER_ADMIN') return 'SA';
  if (role === 'ADMIN') return 'AD';
  return 'CP';
}
