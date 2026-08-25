import { describe, expect, it } from 'vitest';
import { mapBlock, mapCurrentUser, mapMarket } from '../src/services/apiMappers.js';

describe('mapCurrentUser', () => {
  it('mappe un utilisateur avec son rôle et ses permissions', () => {
    const user = mapCurrentUser({
      id: 1,
      name: 'Alexis',
      username: 'alexis',
      email: 'alexis@example.test',
      status: 'ACTIVE',
      role: { id: 2, code: 'ACCOUNTANT', name: 'Comptable' },
      permissions: ['payments.manage'],
    });

    expect(user.role).toBe('ACCOUNTANT');
    expect(user.title).toBe('Chef Comptable');
    expect(user.permissions).toEqual(['payments.manage']);
  });

  it('retourne null pour une entrée vide', () => {
    expect(mapCurrentUser(null)).toBeNull();
  });
});

describe('mapMarket', () => {
  it('utilise les paramètres système comme valeurs de repli', () => {
    const market = mapMarket(
      { id: 1, code: 'MKT-1', name: 'Marché Central' },
      { total_blocks: 4, total_places: 120 },
      [
        { key: 'currency_code', value: 'FBu' },
        { key: 'receipt_prefix', value: 'REC' },
      ],
    );

    expect(market.currency).toBe('FBu');
    expect(market.receiptPrefix).toBe('REC');
    expect(market.totalBlocks).toBe(4);
    expect(market.totalPlaces).toBe(120);
  });

  it('retourne null pour un marché absent', () => {
    expect(mapMarket(null)).toBeNull();
  });
});

describe('mapBlock', () => {
  it('conserve les champs essentiels du bloc', () => {
    const block = mapBlock({
      id: 7,
      code: 'BLK-001',
      name: 'Bloc A-Central',
      default_rent_amount: '50000',
      status: 'ACTIVE',
    });

    expect(block.id).toBe(7);
    expect(block.code).toBe('BLK-001');
    expect(block.status).toBe('ACTIVE');
  });
});
