import { useState, useEffect } from 'react';
import { reports } from '../lib/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, FileText } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import MonthNav from '../components/ui/MonthNav';

export default function Reports() {
  const [month, setMonth] = useState(new Date());
  const [byStatus, setByStatus] = useState([]);
  const [cashFlow, setCashFlow] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [loading, setLoading] = useState(true);

  const from = startOfMonth(month);
  const to = endOfMonth(month);

  useEffect(() => {
    setLoading(true);
    const params = { from: from.toISOString(), to: to.toISOString() };
    Promise.allSettled([
      reports.processesByStatus(),
      reports.cashFlow(params),
      reports.productivity(params),
    ]).then(([statusRes, flowRes, prodRes]) => {
      setByStatus(statusRes.status === 'fulfilled' ? statusRes.value : []);
      setCashFlow(flowRes.status === 'fulfilled' ? flowRes.value : null);
      setProductivity(prodRes.status === 'fulfilled' ? prodRes.value : null);
    }).finally(() => setLoading(false));
  }, [month]);

  const exportText = () => {
    const lines = [
      `Relatório AdvCargo - ${format(month, 'MMMM yyyy', { locale: ptBR })}`,
      '',
      'Processos por status:',
      ...byStatus.map((s) => `  ${s.status}: ${s.count}`),
      '',
      'Fluxo de caixa:',
      `  Receitas: R$ ${(cashFlow?.receitas ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `  Despesas: R$ ${(cashFlow?.despesas ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `  Saldo: R$ ${(cashFlow?.saldo ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      '',
      'Produtividade:',
      `  Audiências realizadas: ${productivity?.audiênciasRealizadas ?? 0} / ${productivity?.audiênciasTotal ?? 0}`,
      `  Prazos cumpridos: ${productivity?.prazosCumpridos ?? 0} / ${productivity?.prazosTotal ?? 0}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-advcargo-${format(month, 'yyyy-MM')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div className="page-container">
      <PageHeader title="Relatórios">
        <MonthNav
          month={month}
          onPrev={() => setMonth(subMonths(month, 1))}
          onNext={() => setMonth(subMonths(month, -1))}
          onToday={() => setMonth(new Date())}
        >
          <button type="button" onClick={exportText} className="btn-primary w-full sm:w-auto">
            <FileText className="w-4 h-4" /> Exportar (TXT)
          </button>
        </MonthNav>
      </PageHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="panel panel-body">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
            <BarChart3 className="w-5 h-5 shrink-0" /> Processos por status
          </h2>
          <ul className="space-y-2">
            {byStatus.map(({ status, count }) => (
              <li key={status} className="flex justify-between text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
            {byStatus.length === 0 && <p className="text-slate-500 text-sm">Nenhum processo.</p>}
          </ul>
        </div>

        <div className="panel panel-body">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4 text-sm sm:text-base">Receitas vs Despesas</h2>
          <div className="space-y-3 text-sm sm:text-base">
            <p className="text-emerald-600 dark:text-emerald-400 break-words">
              Receitas: R$ {(cashFlow?.receitas ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-red-600 dark:text-red-400 break-words">
              Despesas: R$ {(cashFlow?.despesas ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className={`font-semibold break-words ${(cashFlow?.saldo ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              Saldo: R$ {(cashFlow?.saldo ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="panel panel-body sm:col-span-2 lg:col-span-1">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4 text-sm sm:text-base">Produtividade</h2>
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <p>Audiências realizadas: <strong>{productivity?.audiênciasRealizadas ?? 0}</strong> / {productivity?.audiênciasTotal ?? 0}</p>
            <p>Prazos cumpridos: <strong>{productivity?.prazosCumpridos ?? 0}</strong> / {productivity?.prazosTotal ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
