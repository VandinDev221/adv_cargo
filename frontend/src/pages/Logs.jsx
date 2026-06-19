import { useEffect, useState, useCallback } from 'react';
import { logs as logsApi } from '../lib/api';
import { Activity, Wifi, ShieldAlert, RefreshCw, Filter, X } from 'lucide-react';

const PER_PAGE_OPTIONS = [25, 50, 100, 200];
const METHOD_OPTIONS = ['', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
const DEFAULT_ACTIONS = ['auth.login', 'auth.login_failed', 'auth.register', 'rate_limit.exceeded'];

export default function Logs() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [liveData, setLiveData] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [actionsList, setActionsList] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    userEmail: '',
    userName: '',
    ip: '',
    method: '',
    path: '',
    search: '',
    from: '',
    to: '',
  });

  const buildParams = useCallback(() => {
    const p = { page, perPage };
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && String(v).trim() !== '') p[k] = String(v).trim();
    });
    return p;
  }, [page, perPage, filters]);

  const loadAudit = useCallback(() => {
    setLoading(true);
    logsApi
      .list(buildParams())
      .then((res) => {
        setItems(res.items || []);
        setTotal(res.total || 0);
        setPerPage(res.perPage || 50);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [buildParams]);

  const applyFilters = () => {
    setPage(1);
    loadAudit();
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      userId: '',
      userEmail: '',
      userName: '',
      ip: '',
      method: '',
      path: '',
      search: '',
      from: '',
      to: '',
    });
    setPage(1);
  };

  const loadLive = useCallback(() => {
    if (!live) return;
    logsApi
      .live()
      .then((data) => {
        setLiveData(data);
        setLiveError(null);
      })
      .catch((err) => setLiveError(err.message || 'Erro ao carregar monitoramento'));
  }, [live]);

  useEffect(() => {
    logsApi.actions().then(setActionsList).catch(() => setActionsList([]));
  }, []);

  useEffect(() => loadAudit(), [loadAudit]);

  useEffect(() => {
    loadLive();
    if (!live) return;
    const t = setInterval(loadLive, 4000);
    return () => clearInterval(t);
  }, [live, loadLive]);

  const pageCount = Math.max(Math.ceil(total / perPage), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Logs do sistema</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Monitoramento de fluxo, rede e comportamento contra ataques. Apenas usuário desenvolvedor tem acesso.
      </p>

      {/* Monitoramento em tempo real */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Monitoramento em tempo real
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={live}
                onChange={(e) => setLive(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              Ao vivo
            </label>
            <button
              type="button"
              onClick={loadLive}
              disabled={!live}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {liveError && (
          <p className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">{liveError}</p>
        )}

        {liveData && (
          <div className="p-4 space-y-4">
            {/* Fluxo: últimas requisições */}
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Activity className="w-4 h-4" /> Fluxo de requisições
              </h3>
              <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-700/50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5 text-slate-600 dark:text-slate-400">Horário</th>
                      <th className="text-left px-2 py-1.5 text-slate-600 dark:text-slate-400">IP</th>
                      <th className="text-left px-2 py-1.5 text-slate-600 dark:text-slate-400">Método</th>
                      <th className="text-left px-2 py-1.5 text-slate-600 dark:text-slate-400">Rota</th>
                      <th className="text-left px-2 py-1.5 text-slate-600 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(liveData.recentRequests || []).slice(0, 30).map((r, i) => (
                      <tr key={i} className={r.statusCode >= 400 ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                        <td className="px-2 py-1 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(r.timestamp).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="px-2 py-1 font-mono text-slate-700 dark:text-slate-300">{r.ip}</td>
                        <td className="px-2 py-1 text-slate-700 dark:text-slate-300">{r.method}</td>
                        <td className="px-2 py-1 text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={r.path}>{r.path}</td>
                        <td className="px-2 py-1">
                          <span className={r.statusCode >= 400 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                            {r.statusCode}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dados da rede: requisições por IP */}
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Wifi className="w-4 h-4" /> Requisições por IP (janela atual)
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(liveData.rateLimit?.byIp || {}).map(([ip, count]) => (
                  <div
                    key={ip}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                      (liveData.rateLimit?.blockedIps || []).includes(ip)
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : count > (liveData.rateLimit?.maxPerIp || 300) * 0.7
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    title={`Máx. ${liveData.rateLimit?.maxPerIp || 300} req / 15 min`}
                  >
                    {ip}: <strong>{count}</strong>
                    {(liveData.rateLimit?.blockedIps || []).includes(ip) && ' (bloqueado)'}
                  </div>
                ))}
                {Object.keys(liveData.rateLimit?.byIp || {}).length === 0 && (
                  <p className="text-xs text-slate-500">Nenhuma requisição na janela atual.</p>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Limite: {liveData.rateLimit?.maxPerIp ?? 300} requisições por IP a cada 15 min. IPs acima do limite retornam 429.
              </p>
            </div>

            {/* Alertas: falhas de login, rate limit */}
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Alertas de segurança
              </h3>
              <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600">
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {(liveData.alerts || []).map((a) => (
                    <li key={a.id} className="px-3 py-2 text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-slate-500 dark:text-slate-400">
                        {new Date(a.createdAt).toLocaleString('pt-BR')}
                      </span>
                      <span className={`font-medium ${a.action === 'rate_limit.exceeded' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {a.action === 'rate_limit.exceeded' ? 'Rate limit excedido' : 'Login falhou'}
                      </span>
                      {a.ip && <span className="font-mono text-slate-600 dark:text-slate-400">IP: {a.ip}</span>}
                      {a.payload && (
                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={a.payload}>
                          {typeof a.payload === 'string' ? a.payload : JSON.stringify(a.payload)}
                        </span>
                      )}
                    </li>
                  ))}
                  {(!liveData.alerts || liveData.alerts.length === 0) && (
                    <li className="px-3 py-4 text-slate-500 text-center">Nenhum alerta recente.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros e tabela de auditoria */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold text-slate-800 dark:text-white">Histórico de auditoria</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${filtersOpen ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Filter className="w-4 h-4" /> Filtros
              {(filters.action || filters.ip || filters.from || filters.to || filters.search || filters.userEmail || filters.userName || filters.method || filters.path) && (
                <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">!</span>
              )}
            </button>
            {filtersOpen && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" /> Limpar
              </button>
            )}
          </div>
        </div>

        {/* Painel de filtros minuciosos */}
        {filtersOpen && (
          <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Filtros</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ação</label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="">Todas</option>
                  {(actionsList.length ? actionsList : DEFAULT_ACTIONS).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">E-mail do usuário</label>
                <input
                  type="text"
                  value={filters.userEmail}
                  onChange={(e) => setFilters((f) => ({ ...f, userEmail: e.target.value }))}
                  placeholder="Contém..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome do usuário</label>
                <input
                  type="text"
                  value={filters.userName}
                  onChange={(e) => setFilters((f) => ({ ...f, userName: e.target.value }))}
                  placeholder="Contém..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">ID do usuário</label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                  placeholder="UUID"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">IP</label>
                <input
                  type="text"
                  value={filters.ip}
                  onChange={(e) => setFilters((f) => ({ ...f, ip: e.target.value }))}
                  placeholder="Contém..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Método HTTP</label>
                <select
                  value={filters.method}
                  onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m || 'all'} value={m}>{m || 'Todos'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Rota / path</label>
                <input
                  type="text"
                  value={filters.path}
                  onChange={(e) => setFilters((f) => ({ ...f, path: e.target.value }))}
                  placeholder="Contém..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Busca no payload</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Texto no payload..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data inicial</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data final</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={applyFilters}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
              >
                Aplicar filtros
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <h2 className="sr-only">Tabela de auditoria</h2>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Data/hora</th>
                    <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Ação</th>
                    <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Usuário</th>
                    <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">IP</th>
                    <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-300">Rota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {items.map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{log.action}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {log.user ? `${log.user.name} (${log.user.email})` : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{log.ip || '—'}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {log.method || ''} {log.path || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
              <p className="text-center py-8 text-slate-500">Nenhum log registrado ainda.</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm mt-2">
          <div className="flex items-center gap-4">
            <span className="text-slate-500">
              Página {page} de {pageCount} · {total} registros
            </span>
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span>Por página</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              >
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
