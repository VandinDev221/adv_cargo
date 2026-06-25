import { createContext, useContext, useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { apiUrl } from '../lib/config.js';

const GoogleAuthContext = createContext({ clientId: null, enabled: false, loading: true });

async function fetchGoogleConfig() {
  try {
    const res = await fetch(apiUrl('/api/auth/config'));
    if (!res.ok) return null;
    const data = await res.json();
    return data.googleClientId?.trim() || null;
  } catch {
    return null;
  }
}

export function GoogleAuthProvider({ children }) {
  const envClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const [clientId, setClientId] = useState(envClientId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const fromApi = await fetchGoogleConfig();
      if (cancelled) return;
      // API (Render) é a fonte principal; VITE_ serve como fallback no build
      setClientId(fromApi || envClientId || null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [envClientId]);

  const value = {
    clientId,
    enabled: Boolean(clientId),
    loading,
  };

  const inner = (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );

  if (!clientId) return inner;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {inner}
    </GoogleOAuthProvider>
  );
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}
