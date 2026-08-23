const DB_NAME = 'market-manager-db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

async function withStore(mode, handler) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = handler(store);

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
  });
}

export async function dbGet(key) {
  return withStore('readonly', (store) =>
    new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error || new Error(`Failed to read key ${key}.`));
    })
  );
}

export async function dbSet(key, value) {
  return withStore('readwrite', (store) =>
    new Promise((resolve, reject) => {
      const request = store.put(value, key);
      request.onsuccess = () => resolve(value);
      request.onerror = () => reject(request.error || new Error(`Failed to write key ${key}.`));
    })
  );
}

export async function dbDelete(key) {
  return withStore('readwrite', (store) =>
    new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error || new Error(`Failed to delete key ${key}.`));
    })
  );
}
