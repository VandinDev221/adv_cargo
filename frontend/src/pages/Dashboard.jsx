import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { processes as processApi, reports } from '../lib/api';
import { Scale, Users, CalendarClock, Wallet, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [processes, setProcesses] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [cashFlow, setCashFlow] = useState(null);

  useEffect(() => {
    Promise.all([
      processApi.list(),
      reports.processesByStatus(),
      reports.cashFlow({}),
    ]).then(([list, status, flow]) => {
      setProcesses(list.slice(0, 5));
      setByStatus(status);
      setCashFlow(flow);
    }).catch(() => {});
  }, []);

  const statusColors = { ativo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', arquivado: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300', suspenso: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', encerrado: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/processos" className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <Scale className="w-8 h-8 text-primary-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{byStatus.reduce((s, x) => s + x.count, 0)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Processos</p>
        </Link>
        <Link to="/clientes" className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <Users className="w-8 h-8 text-primary-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">—</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Clientes</p>
        </Link>
        <Link to="/prazos" className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CalendarClock className="w-8 h-8 text-primary-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">Prazos</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Próximos</p>
        </Link>
        <Link to="/financeiro" className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <Wallet className="w-8 h-8 text-primary-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {cashFlow != null ? `R$ ${(cashFlow.saldo ?? 0).toLocaleString('pt-BR')}` : '—'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-white">Processos por status</h2>
            <Link to="/processos" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {byStatus.map(({ status, count }) => (
              <span
                key={status}
                className={`px-3 py-1 rounded-full text-sm ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}
              >
                {status}: {count}
              </span>
            ))}
            {byStatus.length === 0 && <p className="text-slate-500 text-sm">Nenhum processo ainda.</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-white">Últimos processos</h2>
            <Link to="/processos" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="space-y-2">
            {processes.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/processos/${p.id}`}
                  className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <span className="font-mono text-sm">{p.number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[p.status] || ''}`}>{p.status}</span>
                </Link>
              </li>
            ))}
            {processes.length === 0 && <p className="text-slate-500 text-sm">Nenhum processo cadastrado.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
