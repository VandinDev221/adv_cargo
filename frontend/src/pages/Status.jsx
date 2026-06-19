import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, Server, RefreshCw, CheckCircle, XCircle, Home } from 'lucide-react';
import { API_BASE, apiUrl } from '../lib/config.js';

export default function Status() {
  const [backend, setBackend] = useState(null);
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const check = async () => {
    setLoading(true);
    setError(null);
    setBackend(null);
    setDb(null);
    try {
      const url = apiUrl('/api/health');
      const res = await fetch(url, { mode: 'cors' });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setBackend('error');
        setError('Resposta inválida do backend.');
        setLoading(false);
        return;
      }
      setBackend(res.ok ? 'ok' : 'error');
      setDb(data.db === 'ok' ? 'ok' : data.db === 'error' ? 'error' : null);
      if (!res.ok) setError(data.error || res.statusText);
    } catch (e) {
      setBackend('error');
      setError(
        API_BASE
          ? `Não foi possível conectar ao backend (${e.message || 'erro de rede'}). Verifique se a API está no ar e se VITE_API_URL está correto.`
          : 'URL da API não configurada (VITE_API_URL). Em desenvolvimento, use o proxy do Vite.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          Verificação de conexão
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Backend e banco de dados (PostgreSQL / Neon)
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Verificando...
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                backend === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              {backend === 'ok' ? (
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Backend (API)
                </div>
                <div className="text-sm opacity-90">
                  {backend === 'ok' ? 'Conectado' : 'Sem conexão ou erro'}
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                db === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : db === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              {db === 'ok' ? (
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : db === 'error' ? (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 shrink-0" />
              ) : (
                <span className="w-8 h-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-600" />
              )}
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Banco de dados
                </div>
                <div className="text-sm opacity-90">
                  {db === 'ok' ? 'Conectado' : db === 'error' ? 'Erro de conexão' : '—'}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </p>
            )}

            {backend !== 'ok' && (
              <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-2">
                <p className="font-medium text-slate-800 dark:text-slate-200">Como conectar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Suba o backend (Railway, Render, etc.) com a mesma <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">DATABASE_URL</code> (ex.: Neon).</li>
                  <li>Na Vercel: Settings → Environment Variables → adicione <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">VITE_API_URL</code> = URL do seu backend no Render (ex.: <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">https://advcargo-api.onrender.com</code>), sem barra no final.</li>
                  <li>Faça um novo deploy do frontend (Redeploy) para a variável ser usada no build.</li>
                </ol>
                {!API_BASE && (
                  <p className="text-amber-700 dark:text-amber-400 mt-2">
                    Agora: <strong>VITE_API_URL</strong> está vazio. Configure na Vercel e faça redeploy.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={check}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                <RefreshCw className="w-4 h-4" /> Verificar novamente
              </button>
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-600 text-white hover:bg-slate-700 dark:hover:bg-slate-500"
              >
                <Home className="w-4 h-4" /> Ir para login
              </Link>
            </div>
          </div>
        )}

        {API_BASE && (
          <p className="mt-4 text-xs text-slate-400 truncate" title={API_BASE}>
            API: {API_BASE}
          </p>
        )}
      </div>
    </div>
  );
}
