import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deadlines as deadlineApi } from '../lib/api';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CalendarClock, Check, Circle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import MonthNav from '../components/ui/MonthNav';
import Modal from '../components/ui/Modal';

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
    <div className="page-container">
      <PageHeader title="Prazos">
        <MonthNav
          month={month}
          onPrev={() => setMonth(subMonths(month, 1))}
          onNext={() => setMonth(addMonths(month, 1))}
        >
          <button type="button" onClick={() => setModal(true)} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Novo prazo
          </button>
        </MonthNav>
      </PageHeader>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <div
              key={d.id}
              className={`list-item border-l-4 ${priorityColors[d.priority] || priorityColors.rotina} ${d.completed ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                onClick={() => toggleComplete(d)}
                className="shrink-0 text-slate-400 hover:text-primary-600 self-start sm:self-center"
                aria-label={d.completed ? 'Marcar pendente' : 'Marcar concluído'}
              >
                {d.completed ? <Check className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-slate-800 dark:text-white ${d.completed ? 'line-through' : ''}`}>{d.title}</p>
                {d.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{d.description}</p>}
                {d.process && (
                  <Link to={`/processos/${d.process.id}`} className="text-xs text-primary-600 hover:underline font-mono mt-1 inline-block">
                    {d.process.number}
                  </Link>
                )}
              </div>
              <div className="sm:text-right shrink-0 pl-8 sm:pl-0">
                <p className="font-medium text-slate-800 dark:text-white">{format(new Date(d.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                <p className="text-xs text-slate-500">{d.type} · {d.priority}</p>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-center py-12 text-slate-500 panel panel-body">
              <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum prazo neste período.</p>
              <button type="button" onClick={() => setModal(true)} className="mt-2 text-primary-600 hover:underline">
                Cadastrar prazo
              </button>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo prazo">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data *</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
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
              className="input-field bg-white dark:bg-slate-700"
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
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary w-full sm:w-auto">
              Cancelar
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Cadastrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
