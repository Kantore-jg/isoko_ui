const DEFAULT_API_BASE_URL = 'http://localhost:8000/api';
const TOKEN_STORAGE_KEY = 'market-management-api-token';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

export function getStoredToken() {
  return getStorage()?.getItem(TOKEN_STORAGE_KEY) || '';
}

export function setStoredToken(token) {
  const storage = getStorage();
  if (!storage) return;

  if (token) {
    storage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    storage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function apiRequest(path, options = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});
  const token = options.token ?? getStoredToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: hasBody
      ? options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });

  const contentType = response.headers.get('content-type') || '';

  const readBody = async () => {
    const raw = await response.text();
    if (!raw) {
      return null;
    }

    const looksLikeJson = raw.trim().startsWith('{') || raw.trim().startsWith('[');

    if (contentType.includes('application/json') || looksLikeJson) {
      const trimmed = raw.trim();
      const attempts = [trimmed, raw];
      const openingIndex = raw.search(/[\[{]/);
      const closingObjectIndex = raw.lastIndexOf('}');
      const closingArrayIndex = raw.lastIndexOf(']');

      if (openingIndex >= 0) {
        attempts.push(raw.slice(openingIndex).trim());

        const closingIndex = Math.max(closingObjectIndex, closingArrayIndex);
        if (closingIndex > openingIndex) {
          attempts.push(raw.slice(openingIndex, closingIndex + 1).trim());
        }
      }

      for (const candidate of attempts) {
        try {
          return JSON.parse(candidate);
        } catch {
          //
        }
      }

      const wrapped = new Error(`Réponse API JSON invalide: ${raw.slice(0, 180)}`);
      wrapped.raw = raw;
      wrapped.status = response.status;
      throw wrapped;
    }

    return raw;
  };

  if (options.responseType === 'blob') {
    if (!response.ok) {
      const payload = await readBody().catch(() => null);
      throw new Error(payload?.message || 'Une erreur est survenue.');
    }

    return response.blob();
  }

  const payload = await readBody();

  if (!response.ok) {
    const error = new Error(payload?.message || (typeof payload === 'string' ? payload : 'Une erreur est survenue.'));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
