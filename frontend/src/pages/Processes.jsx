import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { processes as processApi } from '../lib/api';
import { Plus, Scale, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';

const statusColors = {
  ativo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  arquivado: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300',
  suspenso: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  encerrado: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

export default function Processes() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ number: '', court: '', subject: '', causeValue: '', status: 'ativo', parts: '' });

  const load = () => {
    setLoading(true);
    processApi.list({ ...(statusFilter && { status: statusFilter }), ...(search && { search }) })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [statusFilter, search]);

  const handleCreate = (e) => {
    e.preventDefault();
    processApi.create(form).then(() => {
      setModal(false);
      setForm({ number: '', court: '', subject: '', causeValue: '', status: 'ativo', parts: '' });
      load();
    }).catch((err) => alert(err.message));
  };

  return (
    <div className="page-container">
      <PageHeader title="Processos">
        <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, assunto..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full sm:w-auto"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="arquivado">Arquivado</option>
          <option value="suspenso">Suspenso</option>
          <option value="encerrado">Encerrado</option>
        </select>
        <button type="button" onClick={() => setModal(true)} className="btn-primary w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Novo processo
        </button>
      </PageHeader>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="panel">
          {/* Desktop: tabela */}
          <div className="table-desktop">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Número CNJ</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Assunto</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Cliente</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <Link to={`/processos/${p.id}`} className="font-mono text-primary-600 dark:text-primary-400 hover:underline">
                        {p.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.subject || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.client?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[p.status] || ''}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                      {p.causeValue != null ? `R$ ${Number(p.causeValue).toLocaleString('pt-BR')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="cards-mobile">
            {list.map((p) => (
              <Link key={p.id} to={`/processos/${p.id}`} className="mobile-card">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm text-primary-600 dark:text-primary-400 break-all">{p.number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[p.status] || ''}`}>{p.status}</span>
                </div>
                {p.subject && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{p.subject}</p>}
                <div className="flex items-center justify-between gap-2 mt-2 text-xs text-slate-500">
                  <span className="truncate">{p.client?.name || 'Sem cliente'}</span>
                  <span className="shrink-0">
                    {p.causeValue != null ? `R$ ${Number(p.causeValue).toLocaleString('pt-BR')}` : '—'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {list.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum processo encontrado.</p>
              <button type="button" onClick={() => setModal(true)} className="mt-2 text-primary-600 hover:underline">
                Cadastrar primeiro processo
              </button>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo processo">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número CNJ *</label>
            <input
              type="text"
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              placeholder="0000000-00.0000.0.00.0000"
              className="input-field bg-white dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vara / Tribunal</label>
            <input
              type="text"
              value={form.court}
              onChange={(e) => setForm((f) => ({ ...f, court: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assunto</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor da causa (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.causeValue}
              onChange={(e) => setForm((f) => ({ ...f, causeValue: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Partes</label>
            <input
              type="text"
              value={form.parts}
              onChange={(e) => setForm((f) => ({ ...f, parts: e.target.value }))}
              placeholder="Autor x Réu"
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
            >
              <option value="ativo">Ativo</option>
              <option value="arquivado">Arquivado</option>
              <option value="suspenso">Suspenso</option>
              <option value="encerrado">Encerrado</option>
            </select>
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
