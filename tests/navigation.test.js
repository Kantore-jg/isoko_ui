import { describe, expect, it } from 'vitest';
import {
  getDefaultTabForRole,
  getPathFromTab,
  getTabFromPath,
  getVisibleRoutes,
} from '../src/config/api.js';

describe('navigation', () => {
  it('convertit un onglet en chemin et inversement', () => {
    expect(getPathFromTab('merchants-list')).toBe('/merchants');
    expect(getTabFromPath('/merchants')).toBe('merchants-list');
  });

  it('retourne des valeurs par défaut pour les entrées inconnues', () => {
    expect(getPathFromTab('inconnu')).toBe('/');
    expect(getTabFromPath('/inconnu')).toBe('dashboard-super');
  });

  it('donne l\'onglet par défaut de chaque rôle', () => {
    expect(getDefaultTabForRole('SUPER_ADMIN')).toBe('dashboard-super');
    expect(getDefaultTabForRole('ADMIN')).toBe('dashboard-admin');
    expect(getDefaultTabForRole('ACCOUNTANT')).toBe('dashboard-accountant');
    expect(getDefaultTabForRole('INCONNU')).toBe('dashboard-super');
  });

  it('filtre les routes visibles selon le rôle', () => {
    const accountantRoutes = getVisibleRoutes('ACCOUNTANT');
    expect(accountantRoutes.every((route) => route.roles.includes('ACCOUNTANT'))).toBe(true);
    expect(accountantRoutes.some((route) => route.tab === 'admin-users')).toBe(false);

    const adminRoutes = getVisibleRoutes('ADMIN');
    expect(adminRoutes.some((route) => route.tab === 'admin-users')).toBe(true);
  });
});
