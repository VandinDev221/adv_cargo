import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { users as usersApi, offices as officesApi } from '../lib/api';
import { UserCog, Plus, Pencil, Trash2 } from 'lucide-react';

const ROLES = [
  { value: 'advogado', label: 'Advogado' },
  { value: 'admin', label: 'Administrador' },
  { value: 'assistente', label: 'Assistente' },
  { value: 'dev', label: 'Desenvolvedor' },
];

export default function Users() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'advogado', officeId: '' });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([usersApi.list(), officesApi.list()])
      .then(([users, officesList]) => {
        setList(users);
        setOffices(officesList || []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  if (user?.role !== 'dev') return <Navigate to="/" replace />;

  const openCreate = () => {
    setError('');
    setForm({ name: '', email: '', password: '', role: 'advogado', officeId: offices[0]?.id || '' });
    setModal('create');
  };

  const openEdit = (u) => {
    setError('');
    setForm({ name: u.name, email: u.email, password: '', role: u.role, officeId: u.officeId });
    setModal(u.id);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setError('');
    if (!form.officeId) return setError('Selecione um escritório');
    usersApi
      .create({ ...form, password: form.password || undefined })
      .then(() => {
        setModal(null);
        load();
      })
      .catch((err) => setError(err.message || 'Erro ao criar'));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setError('');
    const id = modal;
    const body = { name: form.name, email: form.email, role: form.role, officeId: form.officeId };
    if (form.password && form.password.trim()) body.password = form.password;
    usersApi
      .update(id, body)
      .then(() => {
        setModal(null);
        load();
      })
      .catch((err) => setError(err.message || 'Erro ao salvar'));
  };

  const handleDelete = (id) => {
    usersApi
      .delete(id)
      .then(() => {
        setDeleteId(null);
        load();
      })
      .catch((err) => alert(err.message || 'Erro ao excluir'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de usuários</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" /> Novo usuário
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Nome</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">E-mail</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Função</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Escritório</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-800 dark:text-white font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 capitalize">{u.role}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.office?.name || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="p-2 text-slate-500 hover:text-primary-600 rounded-lg"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(u.id)}
                        className="p-2 text-slate-500 hover:text-red-500 rounded-lg"
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <UserCog className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum usuário cadastrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal criar / editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Novo usuário' : 'Editar usuário'}</h2>
            {error && <p className="mb-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</p>}
            <form onSubmit={modal === 'create' ? handleCreate : handleUpdate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Senha {modal !== 'create' && '(deixe em branco para manter)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required={modal === 'create'}
                  minLength={modal === 'create' ? 6 : 0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Escritório *</label>
                <select
                  value={form.officeId}
                  onChange={(e) => setForm((f) => ({ ...f, officeId: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required
                >
                  <option value="">Selecione</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  {modal === 'create' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteId(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-slate-700 dark:text-slate-300 mb-4">Deseja realmente excluir este usuário? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
