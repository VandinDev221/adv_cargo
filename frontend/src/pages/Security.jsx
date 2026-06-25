import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { security as securityApi } from '../lib/api';
import { Shield, ShieldOff, AlertTriangle, RefreshCw, Lock, Unlock, Radio } from 'lucide-react';

const LIVE_INTERVAL_MS = 4000;

const THREAT_LABELS = {
  sql_injection: 'SQL Injection',
  xss: 'XSS',
  path_traversal: 'Path traversal',
  suspicious_pattern: 'Padrão suspeito',
};

export default function Security() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState({ fromDb: [], onlyInMemory: [] });
  const [threats, setThreats] = useState({ items: [], byType: [] });
  const [report, setReport] = useState(null);
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blockIp, setBlockIp] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const isMounted = useRef(true);

  if (user?.role !== 'dev') return <Navigate to="/" replace />;

  const load = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    if (isInitial) setError('');
    try {
      const [b, t, r, s] = await Promise.all([
        securityApi.blocked(),
        securityApi.threats({ limit: 100 }),
        securityApi.report({}),
        securityApi.scan({ hours: 24 }),
      ]);
      if (isMounted.current) {
        setBlocked(b);
        setThreats(t);
        setReport(r);
        setScan(s);
        setLastUpdate(new Date());
      }
    } catch (e) {
      if (isMounted.current && isInitial) setError(e.message || 'Erro ao carregar');
    } finally {
      if (isMounted.current && isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    load(true);
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => load(false), LIVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [live]);

  const handleBlock = async (e) => {
    e.preventDefault();
    if (!blockIp.trim()) {
      setError('Informe o IP para bloquear.');
      return;
    }
    setError('');
    setSuccess('');
    setBlocking(true);
    try {
      await securityApi.block({ ip: blockIp.trim(), reason: blockReason.trim() || undefined });
      setSuccess('IP bloqueado. Requisições desse IP passarão a receber 403.');
      setBlockIp('');
      setBlockReason('');
      const b = await securityApi.blocked();
      setBlocked(b);
    } catch (err) {
      setError(err.message || 'Erro ao bloquear. Verifique se a API está no ar e se você está logado como dev.');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (ip) => {
    if (!confirm(`Desbloquear ${ip}?`)) return;
    setError('');
    setSuccess('');
    try {
      await securityApi.unblock(ip);
      setSuccess('IP desbloqueado.');
      load();
    } catch (e) {
      setError(e.message || 'Erro ao desbloquear');
    }
  };

  if (loading && !blocked.fromDb?.length && !report) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">Carregando defesa...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
          Defesa e ameaças
        </h1>
        <div className="page-actions">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={live}
              onChange={(e) => setLive(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <Radio className="w-4 h-4 text-emerald-600" />
            Ao vivo
          </label>
          {lastUpdate && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Atualizado {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            type="button"
            onClick={() => load(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200">
          {success}
        </div>
      )}

      {/* Resumo */}
      {report && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-amber-600">{report.summary?.threats ?? 0}</div>
            <div className="text-sm text-slate-500">Ameaças detectadas</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-red-600">{report.summary?.failedLogins ?? 0}</div>
            <div className="text-sm text-slate-500">Logins falhos</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-orange-600">{report.summary?.rateLimitHits ?? 0}</div>
            <div className="text-sm text-slate-500">Rate limit excedido</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{report.summary?.blockedCount ?? 0}</div>
            <div className="text-sm text-slate-500">IPs bloqueados</div>
          </div>
        </section>
      )}

      {/* Bloquear IP */}
      <section className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <h2 className="font-medium flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5" /> Bloquear IP
        </h2>
        <form onSubmit={handleBlock} className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2 sm:items-end">
          <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[140px]">
            <label className="block text-sm text-slate-500 mb-1">IP</label>
            <input
              type="text"
              value={blockIp}
              onChange={(e) => setBlockIp(e.target.value)}
              placeholder="192.168.1.1"
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
            <label className="block text-sm text-slate-500 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ex: tentativa de ataque"
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <button type="submit" disabled={blocking} className="btn-primary w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-50">
            {blocking ? 'Bloqueando...' : 'Bloquear'}
          </button>
        </form>
      </section>

      {/* IPs bloqueados */}
      <section className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <h2 className="font-medium flex items-center gap-2 mb-3">
          <ShieldOff className="w-5 h-5" /> IPs bloqueados
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="text-left py-2">IP</th>
                <th className="text-left py-2">Motivo</th>
                <th className="text-left py-2">Data</th>
                <th className="text-right py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {blocked.fromDb?.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-2 font-mono">{r.ip}</td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">{r.reason || '—'}</td>
                  <td className="py-2 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleUnblock(r.ip)}
                      className="text-emerald-600 hover:underline flex items-center gap-1 ml-auto"
                    >
                      <Unlock className="w-4 h-4" /> Desbloquear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {blocked.onlyInMemory?.length > 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Em memória (ainda não persistidos): {blocked.onlyInMemory.join(', ')}
          </p>
        )}
      </section>

      {/* Scan: sugestões de bloqueio */}
      {scan?.suggested?.length > 0 && (
        <section className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h2 className="font-medium flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" /> IPs sugeridos para bloqueio (scan 24h)
          </h2>
          <ul className="space-y-1 text-sm">
            {scan.suggested.map(({ ip, score }) => (
              <li key={ip} className="flex justify-between items-center">
                <span className="font-mono">{ip}</span>
                <span className="text-slate-500">score {score}</span>
                <button
                  type="button"
                  onClick={() => { setBlockIp(ip); setBlockReason('Sugestão do scan'); }}
                  className="text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Bloquear
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ameaças detectadas */}
      <section className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <h2 className="font-medium mb-3">Últimas ameaças detectadas</h2>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="text-left py-2">Data</th>
                <th className="text-left py-2">IP</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-left py-2">Caminho</th>
              </tr>
            </thead>
            <tbody>
              {threats.items?.slice(0, 50).map((t) => (
                <tr key={t.id} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-1 text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="py-1 font-mono">{t.ip || '—'}</td>
                  <td className="py-1">{THREAT_LABELS[t.threatType] || t.threatType}</td>
                  <td className="py-1 truncate max-w-[200px]" title={t.path}>{t.path || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Scripts disponíveis */}
      <section className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
        <h2 className="font-medium mb-2">Scripts de defesa (terminal, na pasta backend)</h2>
        <ul className="space-y-1 font-mono text-slate-600 dark:text-slate-400">
          <li><code>node scripts/block-ip.js &lt;IP&gt; [motivo]</code> — Bloquear IP</li>
          <li><code>node scripts/unblock-ip.js &lt;IP&gt;</code> — Desbloquear IP</li>
          <li><code>node scripts/threat-report.js [horas]</code> — Relatório de ameaças</li>
          <li><code>node scripts/threat-scan.js [horas]</code> — Scan de IPs suspeitos</li>
          <li><code>node scripts/export-threats.js [horas] [json|csv]</code> — Exportar para análise</li>
        </ul>
      </section>
    </div>
  );
}
