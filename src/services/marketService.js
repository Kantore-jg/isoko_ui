import { dbDelete, dbGet, dbSet } from './db.js';
import { getSeedState } from '../config/api.js';

const MARKET_STATE_KEY = 'market-state';

export async function loadMarketState() {
  const saved = await dbGet(MARKET_STATE_KEY);
  return saved || getSeedState();
}

export async function saveMarketState(state) {
  await dbSet(MARKET_STATE_KEY, state);
  return state;
}

export async function resetMarketState() {
  await dbDelete(MARKET_STATE_KEY);
  return getSeedState();
}
