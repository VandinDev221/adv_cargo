import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { processes as processApi } from '../lib/api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors = {
  ativo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  arquivado: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300',
  suspenso: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  encerrado: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

export default function ProcessDetail() {
  const { id } = useParams();
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', type: 'geral' });

  useEffect(() => {
    processApi.get(id).then(setProcess).catch(() => setProcess(null)).finally(() => setLoading(false));
  }, [id]);

  const addEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    processApi.addTimeline(id, newEvent).then((event) => {
      setProcess((p) => ({ ...p, timeline: [event, ...(p.timeline || [])] }));
      setNewEvent({ title: '', description: '', type: 'geral' });
    }).catch((err) => alert(err.message));
  };

  const removeEvent = (eventId) => {
    if (!confirm('Remover este evento?')) return;
    processApi.deleteTimeline(id, eventId).then(() => {
      setProcess((p) => ({ ...p, timeline: (p.timeline || []).filter((e) => e.id !== eventId) }));
    }).catch((err) => alert(err.message));
  };

  if (loading) return <p className="text-slate-500">Carregando...</p>;
  if (!process) return <p className="text-slate-500">Processo não encontrado.</p>;

  return (
    <div className="page-container">
      <Link to="/processos" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-600 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className="panel panel-body">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-mono font-semibold text-slate-800 dark:text-white break-all">{process.number}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">{process.subject || 'Sem assunto'}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${statusColors[process.status] || ''}`}>
              {process.status}
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 sm:text-right">
            {process.court && <p>Vara: {process.court}</p>}
            {process.causeValue != null && <p>Valor da causa: R$ {Number(process.causeValue).toLocaleString('pt-BR')}</p>}
            {process.client && (
              <p>
                Cliente:{' '}
                <Link to={`/clientes/${process.client.id}`} className="text-primary-600 hover:underline">
                  {process.client.name}
                </Link>
              </p>
            )}
            {process.parts && <p>Partes: {process.parts}</p>}
          </div>
        </div>
      </div>

      <div className="panel panel-body">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Linha do tempo</h2>
        <form onSubmit={addEvent} className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-6">
          <input
            type="text"
            value={newEvent.title}
            onChange={(e) => setNewEvent((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título do evento"
            className="input-field sm:flex-1 sm:min-w-[160px] bg-white dark:bg-slate-700"
          />
          <input
            type="text"
            value={newEvent.description}
            onChange={(e) => setNewEvent((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descrição (opcional)"
            className="input-field sm:flex-1 sm:min-w-[160px] bg-white dark:bg-slate-700"
          />
          <select
            value={newEvent.type}
            onChange={(e) => setNewEvent((f) => ({ ...f, type: e.target.value }))}
            className="input-field sm:w-auto bg-white dark:bg-slate-700"
          >
            <option value="geral">Geral</option>
            <option value="movimentacao">Movimentação</option>
            <option value="audiência">Audiência</option>
            <option value="decisão">Decisão</option>
          </select>
          <button type="submit" className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </form>

        <ul className="space-y-0">
          {(process.timeline || []).map((event) => (
            <li key={event.id} className="flex gap-3 sm:gap-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white text-sm sm:text-base">{event.title}</p>
                {event.description && <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>}
                <p className="text-xs text-slate-500 mt-1">{format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · {event.type}</p>
              </div>
              <button
                type="button"
                onClick={() => removeEvent(event.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 shrink-0"
                aria-label="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
        {(!process.timeline || process.timeline.length === 0) && (
          <p className="text-slate-500 text-sm py-4">Nenhum evento na timeline. Adicione acima.</p>
        )}
      </div>

      <div className="panel panel-body">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-2">Documentos</h2>
        <form
          className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            if (!fd.get('file')?.name) return;
            processApi.uploadDocument(id, fd).then((doc) => {
              setProcess((p) => ({ ...p, documents: [...(p.documents || []), doc] }));
              e.target.reset();
            }).catch((err) => alert(err.message));
          }}
        >
          <input type="file" name="file" className="text-sm text-slate-600 dark:text-slate-400 w-full sm:w-auto" />
          <input
            type="text"
            name="name"
            placeholder="Nome (opcional)"
            className="input-field sm:flex-1 sm:min-w-[120px] bg-white dark:bg-slate-700"
          />
          <button type="submit" className="btn-primary w-full sm:w-auto">Anexar</button>
        </form>
        {process.documents?.length > 0 ? (
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {process.documents.map((d) => (
              <li key={d.id} className="break-all">{d.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">Nenhum documento anexado.</p>
        )}
      </div>
    </div>
  );
}
