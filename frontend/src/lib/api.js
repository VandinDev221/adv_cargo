const API = import.meta.env.VITE_API_URL || '';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  const looksLikeHtml = !text.trim() ? false : text.trimStart().startsWith('<') || text.trimStart().startsWith('The page') || text.includes('</html>');
  if (!contentType.includes('application/json') || looksLikeHtml) {
    const msg = looksLikeHtml || text.startsWith('<!') || text.startsWith('The page')
      ? 'A API retornou HTML em vez de JSON. Verifique se VITE_API_URL aponta para o backend (ex.: URL da API no Railway/Render).'
      : (text.slice(0, 100) || res.statusText);
    throw new Error(msg);
  }
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Resposta inválida da API. Verifique se o backend está no ar e a URL em VITE_API_URL.');
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const processes = {
  list: (params) => api('/api/processes?' + new URLSearchParams(params).toString()),
  get: (id) => api(`/api/processes/${id}`),
  create: (body) => api('/api/processes', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/processes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/api/processes/${id}`, { method: 'DELETE' }),
  addTimeline: (id, body) => api(`/api/processes/${id}/timeline`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTimeline: (id, eventId) => api(`/api/processes/${id}/timeline/${eventId}`, { method: 'DELETE' }),
  uploadDocument: (id, formData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API}/api/processes/${id}/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (r) => {
      const text = await r.text();
      let data = {};
      try { if (text) data = JSON.parse(text); } catch (_) {}
      if (!r.ok) return Promise.reject(new Error(data.error || text.slice(0, 80) || 'Erro no upload'));
      return data;
    });
  },
};

export const clients = {
  list: (params) => api('/api/clients?' + new URLSearchParams(params).toString()),
  get: (id) => api(`/api/clients/${id}`),
  create: (body) => api('/api/clients', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/api/clients/${id}`, { method: 'DELETE' }),
};

export const deadlines = {
  list: (params) => api('/api/deadlines?' + new URLSearchParams(params).toString()),
  create: (body) => api('/api/deadlines', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/deadlines/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/api/deadlines/${id}`, { method: 'DELETE' }),
};

export const hearings = {
  list: (params) => api('/api/hearings?' + new URLSearchParams(params).toString()),
  create: (body) => api('/api/hearings', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/hearings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/api/hearings/${id}`, { method: 'DELETE' }),
};

export const financial = {
  list: (params) => api('/api/financial?' + new URLSearchParams(params).toString()),
  create: (body) => api('/api/financial', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/financial/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/api/financial/${id}`, { method: 'DELETE' }),
};

export const reports = {
  processesByStatus: () => api('/api/reports/processes-by-status'),
  cashFlow: (params) => api('/api/reports/cash-flow?' + new URLSearchParams(params).toString()),
  productivity: (params) => api('/api/reports/productivity?' + new URLSearchParams(params).toString()),
};

export const search = {
  global: (q) => api('/api/search?q=' + encodeURIComponent(q)),
};

export const logs = {
  list: (params) => api('/api/logs?' + new URLSearchParams(params).toString()),
  live: () => api('/api/logs/live'),
  actions: () => api('/api/logs/actions'),
  requests: (params) => api('/api/logs/requests?' + new URLSearchParams(params).toString()),
};

export const offices = {
  list: () => api('/api/offices'),
};

export const users = {
  list: () => api('/api/users'),
  get: (id) => api(`/api/users/${id}`),
  create: (body) => api('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/api/users/${id}`, { method: 'DELETE' }),
};

export const security = {
  blocked: () => api('/api/security/blocked'),
  block: (body) => api('/api/security/block', { method: 'POST', body: JSON.stringify(body) }),
  unblock: (ip) => api(`/api/security/block/${encodeURIComponent(ip)}`, { method: 'DELETE' }),
  threats: (params) => api('/api/security/threats?' + new URLSearchParams(params).toString()),
  report: (params) => api('/api/security/report?' + new URLSearchParams(params).toString()),
  scan: (params) => api('/api/security/scan?' + new URLSearchParams(params).toString()),
};
