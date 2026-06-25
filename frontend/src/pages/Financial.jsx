import { useState, useEffect } from 'react';
import { financial as financialApi } from '../lib/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Wallet } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import MonthNav from '../components/ui/MonthNav';
import Modal from '../components/ui/Modal';

const typeLabels = { honorario: 'Honorário', receita: 'Receita', despesa: 'Despesa' };

export default function Financial() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    type: 'honorario',
    description: '',
    value: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const from = startOfMonth(month);
  const to = endOfMonth(month);

  const load = () => {
    setLoading(true);
    financialApi.list({ from: from.toISOString(), to: to.toISOString() })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [month]);

  const receitas = list.filter((i) => i.type === 'receita' || i.type === 'honorario').reduce((s, i) => s + i.value, 0);
  const despesas = list.filter((i) => i.type === 'despesa').reduce((s, i) => s + i.value, 0);
  const saldo = receitas - despesas;

  const handleCreate = (e) => {
    e.preventDefault();
    financialApi.create({ ...form, value: Number(form.value) }).then(() => {
      setModal(false);
      setForm({ type: 'honorario', description: '', value: '', date: format(new Date(), 'yyyy-MM-dd') });
      load();
    }).catch((err) => alert(err.message));
  };

  return (
    <div className="page-container">
      <PageHeader title="Financeiro">
        <MonthNav
          month={month}
          onPrev={() => setMonth(subMonths(month, 1))}
          onNext={() => setMonth(subMonths(month, -1))}
          onToday={() => setMonth(new Date())}
        >
          <button type="button" onClick={() => setModal(true)} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Lançamento
          </button>
        </MonthNav>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">Receitas</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-800 dark:text-emerald-300 break-words">
            R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">Despesas</p>
          <p className="text-lg sm:text-xl font-bold text-red-800 dark:text-red-300 break-words">
            R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Saldo</p>
          <p className={`text-lg sm:text-xl font-bold break-words ${saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="panel">
          <div className="table-desktop">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Data</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Descrição</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Tipo</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.description}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{typeLabels[item.type] || item.type}</td>
                    <td className={`px-4 py-3 text-right font-medium ${item.type === 'despesa' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {item.type === 'despesa' ? '-' : ''} R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cards-mobile">
            {list.map((item) => (
              <div key={item.id} className="mobile-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">{item.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })} · {typeLabels[item.type] || item.type}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${item.type === 'despesa' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {item.type === 'despesa' ? '-' : ''} R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {list.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum lançamento neste período.</p>
              <button type="button" onClick={() => setModal(true)} className="mt-2 text-primary-600 hover:underline">
                Adicionar lançamento
              </button>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo lançamento">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
            >
              <option value="honorario">Honorário</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary w-full sm:w-auto">
              Cancelar
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
