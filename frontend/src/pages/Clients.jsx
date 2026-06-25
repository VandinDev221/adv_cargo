import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clients as clientApi } from '../lib/api';
import { Plus, Users, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';

export default function Clients() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', document: '', type: 'pf', email: '', phone: '', address: '' });

  const load = () => {
    setLoading(true);
    clientApi.list({ ...(search && { search }) })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [search]);

  const handleCreate = (e) => {
    e.preventDefault();
    clientApi.create(form).then(() => {
      setModal(false);
      setForm({ name: '', document: '', type: 'pf', email: '', phone: '', address: '' });
      load();
    }).catch((err) => alert(err.message));
  };

  return (
    <div className="page-container">
      <PageHeader title="Clientes">
        <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ..."
            className="input-field pl-9"
          />
        </div>
        <button type="button" onClick={() => setModal(true)} className="btn-primary w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Novo cliente
        </button>
      </PageHeader>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="panel">
          <div className="table-desktop">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Nome</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">CPF/CNPJ</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Contato</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Processos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <Link to={`/clientes/${c.id}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.document}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.email || c.phone || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{c._count?.processes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cards-mobile">
            {list.map((c) => (
              <Link key={c.id} to={`/clientes/${c.id}`} className="mobile-card">
                <p className="font-medium text-primary-600 dark:text-primary-400">{c.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{c.document}</p>
                <div className="flex items-center justify-between gap-2 mt-2 text-xs text-slate-500">
                  <span className="truncate">{c.email || c.phone || 'Sem contato'}</span>
                  <span className="shrink-0">{c._count?.processes ?? 0} processo(s)</span>
                </div>
              </Link>
            ))}
          </div>

          {list.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum cliente encontrado.</p>
              <button type="button" onClick={() => setModal(true)} className="mt-2 text-primary-600 hover:underline">
                Cadastrar primeiro cliente
              </button>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo cliente">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF/CNPJ *</label>
            <input
              type="text"
              value={form.document}
              onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))}
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
              <option value="pf">Pessoa Física</option>
              <option value="pj">Pessoa Jurídica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="input-field bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
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
