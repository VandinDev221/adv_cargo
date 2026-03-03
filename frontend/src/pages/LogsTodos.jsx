import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logs as logsApi } from '../lib/api';
import { FileText, Globe, RefreshCw } from 'lucide-react';

const PER_PAGE_ALL = 10000;

export default function LogsTodos() {
  const { user } = useAuth();
  const [audit, setAudit] = useState({ items: [], total: 0, loading: true });
  const [requests, setRequests] = useState({ items: [], total: 0, loading: true });

  const loadAudit = useCallback(() => {
    setAudit((a) => ({ ...a, loading: true }));
    logsApi
      .list({ page: '1', perPage: String(PER_PAGE_ALL) })
      .then((res) => setAudit({ items: res.items || [], total: res.total || 0, loading: false }))
      .catch(() => setAudit((a) => ({ ...a, items: [], loading: false })));
  }, []);

  const loadRequests = useCallback(() => {
    setRequests((r) => ({ ...r, loading: true }));
    logsApi
      .requests({ page: '1', perPage: String(PER_PAGE_ALL) })
      .then((res) => setRequests({ items: res.items || [], total: res.total || 0, loading: false }))
      .catch(() => setRequests((r) => ({ ...r, items: [], loading: false })));
  }, []);

  const loadAll = useCallback(() => {
    loadAudit();
    loadRequests();
  }, [loadAudit, loadRequests]);

  useEffect(() => loadAll(), [loadAll]);

  if (user?.role !== 'dev') return <Navigate to="/" replace />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Todos os logs e requisições</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Nenhum registro é excluído. Logs de auditoria e todas as requisições HTTP ficam gravados no banco.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar tudo
        </button>
      </div>

      {/* Logs de auditoria */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            Logs de auditoria ({audit.total})
          </h2>
          {!audit.loading && (
            <button type="button" onClick={loadAudit} className="text-sm text-primary-600 hover:underline">
              Recarregar
            </button>
          )}
        </div>
        {audit.loading ? (
          <p className="p-6 text-slate-500">Carregando...</p>
        ) : (
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Data/hora</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Ação</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Usuário</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">IP</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Método</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Rota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {audit.items.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{log.action}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {log.user ? `${log.user.name} (${log.user.email})` : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-mono">{log.ip || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{log.method || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={log.path}>{log.path || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!audit.loading && audit.items.length === 0 && (
          <p className="p-6 text-center text-slate-500">Nenhum log de auditoria.</p>
        )}
      </section>

      {/* Requisições HTTP */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-500" />
            Requisições HTTP ({requests.total})
          </h2>
          {!requests.loading && (
            <button type="button" onClick={loadRequests} className="text-sm text-primary-600 hover:underline">
              Recarregar
            </button>
          )}
        </div>
        {requests.loading ? (
          <p className="p-6 text-slate-500">Carregando...</p>
        ) : (
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Data/hora</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">IP</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Método</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Rota</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Status</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">User-Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {requests.items.map((r) => (
                  <tr key={r.id} className={r.statusCode >= 400 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-mono">{r.ip || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.method || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[220px]" title={r.path}>{r.path || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={r.statusCode >= 400 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-700 dark:text-slate-300'}>
                        {r.statusCode ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs truncate max-w-[180px]" title={r.userAgent}>{r.userAgent || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!requests.loading && requests.items.length === 0 && (
          <p className="p-6 text-center text-slate-500">Nenhuma requisição registrada ainda.</p>
        )}
      </section>
    </div>
  );
}
