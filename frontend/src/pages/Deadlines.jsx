import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deadlines as deadlineApi } from '../lib/api';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CalendarClock, Check, Circle } from 'lucide-react';

const priorityColors = {
  urgente: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  importante: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
  rotina: 'border-l-slate-400 bg-slate-50 dark:bg-slate-800/50',
};

export default function Deadlines() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'processual',
    priority: 'rotina',
    notify24h: true,
    notify48h: true,
    notify7d: true,
  });

  const from = startOfMonth(month);
  const to = endOfMonth(month);

  const load = () => {
    setLoading(true);
    deadlineApi.list({ from: from.toISOString(), to: to.toISOString() })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [month]);

  const handleCreate = (e) => {
    e.preventDefault();
    deadlineApi.create(form).then(() => {
      setModal(false);
      setForm({
        title: '',
        description: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        type: 'processual',
        priority: 'rotina',
        notify24h: true,
        notify48h: true,
        notify7d: true,
      });
      load();
    }).catch((err) => alert(err.message));
  };

  const toggleComplete = (item) => {
    deadlineApi.update(item.id, { completed: !item.completed }).then(() => load()).catch((err) => alert(err.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Prazos</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            ←
          </button>
          <span className="min-w-[180px] text-center font-medium text-slate-800 dark:text-white">
            {format(month, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 ml-2"
          >
            <Plus className="w-4 h-4" /> Novo prazo
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <div
              key={d.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${priorityColors[d.priority] || priorityColors.rotina} border border-slate-200 dark:border-slate-700 ${d.completed ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                onClick={() => toggleComplete(d)}
                className="shrink-0 text-slate-400 hover:text-primary-600"
                aria-label={d.completed ? 'Marcar pendente' : 'Marcar concluído'}
              >
                {d.completed ? <Check className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-slate-800 dark:text-white ${d.completed ? 'line-through' : ''}`}>{d.title}</p>
                {d.description && <p className="text-sm text-slate-600 dark:text-slate-400">{d.description}</p>}
                {d.process && (
                  <Link to={`/processos/${d.process.id}`} className="text-xs text-primary-600 hover:underline font-mono">
                    {d.process.number}
                  </Link>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium text-slate-800 dark:text-white">{format(new Date(d.dueDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                <p className="text-xs text-slate-500">{d.type} · {d.priority}</p>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum prazo neste período.</p>
              <button type="button" onClick={() => setModal(true)} className="mt-2 text-primary-600 hover:underline">
                Cadastrar prazo
              </button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Novo prazo</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="processual">Processual</option>
                  <option value="extrajudicial">Extrajudicial</option>
                  <option value="compromisso">Compromisso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="rotina">Rotina</option>
                  <option value="importante">Importante</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
