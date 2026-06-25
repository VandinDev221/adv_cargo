import { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../lib/config.js';

const AuthContext = createContext(null);

async function parseJsonResponse(res) {
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  const looksLikeHtml = text.trimStart().startsWith('<') || text.trimStart().startsWith('The page') || text.includes('</html>');
  if (!ct.includes('application/json') || looksLikeHtml) {
    if (looksLikeHtml || text.startsWith('<!') || text.startsWith('The page')) {
      throw new Error('A API retornou HTML. Verifique se VITE_API_URL aponta para o backend.');
    }
    throw new Error(text.slice(0, 80) || res.statusText);
  }
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Resposta inválida da API. Verifique VITE_API_URL.');
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(apiUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await parseJsonResponse(r);
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const res = await fetch(apiUrl('/api/auth/register/send-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar código');
    return data;
  };

  const sendRegisterCode = register;

  const verifyRegister = async ({ email, code }) => {
    const res = await fetch(apiUrl('/api/auth/register/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Erro ao verificar código');
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const resendRegisterCode = async (email) => {
    const res = await fetch(apiUrl('/api/auth/register/resend-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Erro ao reenviar código');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const loginWithGoogle = async (credential) => {
    const res = await fetch(apiUrl('/api/auth/google'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Erro ao entrar com Google');
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const getToken = () => localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, sendRegisterCode, verifyRegister, resendRegisterCode, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
