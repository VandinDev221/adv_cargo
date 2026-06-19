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
    <div className="space-y-6">
      <Link to="/processos" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-mono font-semibold text-slate-800 dark:text-white">{process.number}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{process.subject || 'Sem assunto'}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${statusColors[process.status] || ''}`}>
              {process.status}
            </span>
          </div>
          <div className="text-right text-sm text-slate-600 dark:text-slate-400">
            {process.court && <p>Vara: {process.court}</p>}
            {process.causeValue != null && <p>Valor da causa: R$ {Number(process.causeValue).toLocaleString('pt-BR')}</p>}
            {process.client && <p>Cliente: <Link to={`/clientes/${process.client.id}`} className="text-primary-600 hover:underline">{process.client.name}</Link></p>}
            {process.parts && <p className="mt-1">Partes: {process.parts}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Linha do tempo</h2>
        <form onSubmit={addEvent} className="flex flex-wrap gap-2 mb-6">
          <input
            type="text"
            value={newEvent.title}
            onChange={(e) => setNewEvent((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título do evento"
            className="flex-1 min-w-[180px] px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
          />
          <input
            type="text"
            value={newEvent.description}
            onChange={(e) => setNewEvent((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descrição (opcional)"
            className="flex-1 min-w-[180px] px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
          />
          <select
            value={newEvent.type}
            onChange={(e) => setNewEvent((f) => ({ ...f, type: e.target.value }))}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
          >
            <option value="geral">Geral</option>
            <option value="movimentacao">Movimentação</option>
            <option value="audiência">Audiência</option>
            <option value="decisão">Decisão</option>
          </select>
          <button type="submit" className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </form>

        <ul className="space-y-0">
          {(process.timeline || []).map((event) => (
            <li key={event.id} className="flex gap-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white">{event.title}</p>
                {event.description && <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>}
                <p className="text-xs text-slate-500 mt-1">{format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · {event.type}</p>
              </div>
              <button
                type="button"
                onClick={() => removeEvent(event.id)}
                className="p-1 text-slate-400 hover:text-red-500"
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

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-2">Documentos</h2>
        <form
          className="flex flex-wrap gap-2 mb-4"
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
          <input type="file" name="file" className="text-sm text-slate-600 dark:text-slate-400" />
          <input type="text" name="name" placeholder="Nome (opcional)" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 flex-1 min-w-[120px]" />
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Anexar</button>
        </form>
        {process.documents?.length > 0 ? (
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {process.documents.map((d) => (
              <li key={d.id}>{d.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">Nenhum documento anexado.</p>
        )}
      </div>
    </div>
  );
}
