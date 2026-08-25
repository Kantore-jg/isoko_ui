import { beforeEach, describe, expect, it } from 'vitest';
import { marketStore } from '../src/store/index.js';

describe('marketStore (Pinia)', () => {
  beforeEach(() => {
    localStorage.clear();
    marketStore.setIsNewPaymentModalOpen(false);
    marketStore.setSelectedReceipt(null);
    marketStore.state.sidebarCollapsed = false;
  });

  it('expose un état initial cohérent', () => {
    expect(marketStore.state.currentUser).toBeNull();
    expect(Array.isArray(marketStore.state.blocks)).toBe(true);
    expect(Array.isArray(marketStore.state.payments)).toBe(true);
    expect(marketStore.state.isNewPaymentModalOpen).toBe(false);
  });

  it('ouvre et ferme la modale de paiement', () => {
    marketStore.setIsNewPaymentModalOpen(true);
    expect(marketStore.state.isNewPaymentModalOpen).toBe(true);

    marketStore.setIsNewPaymentModalOpen(false);
    expect(marketStore.state.isNewPaymentModalOpen).toBe(false);
  });

  it('bascule l\'état de la barre latérale', () => {
    const before = marketStore.state.sidebarCollapsed;
    marketStore.toggleSidebar();
    expect(marketStore.state.sidebarCollapsed).toBe(!before);
  });

  it('calcule les KPIs sans erreur sur des collections vides', () => {
    expect(Number.isFinite(marketStore.kpis.occupancyRate ?? 0)).toBe(true);
  });
});
