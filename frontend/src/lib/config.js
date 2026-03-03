/**
 * URL base da API (backend).
 * Definida em build time via VITE_API_URL (ex.: na Vercel = URL do Railway).
 * Sem barra no final para evitar duplicação em paths como /api/health.
 */
const raw = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE = raw ? raw.replace(/\/+$/, '') : '';

/** Monta a URL completa para um path (path deve começar com /). */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}
