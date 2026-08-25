import { describe, expect, it } from 'vitest';
import { abbreviateRole, formatCurrency } from '../src/utils/format.js';

const normalize = (value) => String(value).replace(/[\s\u00a0\u202f]/g, ' ');

describe('formatCurrency', () => {
  it('formate un montant avec la devise par défaut', () => {
    expect(normalize(formatCurrency(15000))).toBe('15 000 FBu');
  });

  it('retourne zéro pour une valeur nulle ou invalide', () => {
    expect(normalize(formatCurrency(null))).toBe('0 FBu');
    expect(normalize(formatCurrency(undefined))).toBe('0 FBu');
  });

  it('accepte une devise personnalisée', () => {
    expect(normalize(formatCurrency(2500, 'BIF'))).toBe('2 500 BIF');
  });
});

describe('abbreviateRole', () => {
  it('abrège les rôles connus', () => {
    expect(abbreviateRole('SUPER_ADMIN')).toBe('SA');
    expect(abbreviateRole('ADMIN')).toBe('AD');
    expect(abbreviateRole('ACCOUNTANT')).toBe('CP');
  });
});
