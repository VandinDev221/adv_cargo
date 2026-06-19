import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hearings as hearingApi } from '../lib/api';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Calendar, Check, Circle } from 'lucide-react';

export default function Hearings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    location: '',
    type: '',
  });

  const from = startOfMonth(month);
  const to = endOfMonth(month);

  const load = () => {
    setLoading(true);
    hearingApi.list({ from: from.toISOString(), to: to.toISOString() })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [month]);

  const handleCreate = (e) => {
    e.preventDefault();
    hearingApi.create(form).then(() => {
      setModal(false);
      setForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', location: '', type: '' });
      load();
    }).catch((err) => alert(err.message));
  };

  const toggleComplete = (item) => {
    hearingApi.update(item.id, { completed: !item.completed }).then(() => load()).catch((err) => alert(err.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Audiências</h1>
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
            <Plus className="w-4 h-4" /> Nova audiência
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {list.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <button
                type="button"
                onClick={() => toggleComplete(h)}
                className="shrink-0 text-slate-400 hover:text-primary-600"
                aria-label={h.completed ? 'Marcar não realizada' : 'Marcar realizada'}
              >
                {h.completed ? <Check className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-slate-800 dark:text-white ${h.completed ? 'line-through' : ''}`}>{h.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {format(new Date(h.date), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                  {h.time && ` · ${h.time}`}
                </p>
                {h.location && <p className="text-sm text-slate-500">{h.location}</p>}
                {h.process && (
                  <Link to={`/processos/${h.process.id}`} className="text-xs text-primary-600 hover:underline font-mono">
                    {h.process.number}
                  </Link>
                )}
              </div>
              {h.type && <span className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">{h.type}</span>}
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma audiência neste período.</p>
              <button type="button" onClick={() => setModal(true)} className="mt-2 text-primary-600 hover:underline">
                Agendar audiência
              </button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nova audiência</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Audiência de instrução"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Local</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Sala, fórum..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                <input
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  placeholder="Conciliação, instrução..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
