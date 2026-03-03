import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { clients as clientApi } from '../lib/api';
import { ArrowLeft } from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApi.get(id).then(setClient).catch(() => setClient(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-slate-500">Carregando...</p>;
  if (!client) return <p className="text-slate-500">Cliente não encontrado.</p>;

  return (
    <div className="space-y-6">
      <Link to="/clientes" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{client.name}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">CPF/CNPJ: {client.document} · {client.type === 'pj' ? 'PJ' : 'PF'}</p>
        {client.email && <p className="text-slate-600 dark:text-slate-400">E-mail: {client.email}</p>}
        {client.phone && <p className="text-slate-600 dark:text-slate-400">Telefone: {client.phone}</p>}
        {client.address && <p className="text-slate-600 dark:text-slate-400">Endereço: {client.address}</p>}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Processos</h2>
        {client.processes?.length > 0 ? (
          <ul className="space-y-2">
            {client.processes.map((p) => (
              <li key={p.id}>
                <Link to={`/processos/${p.id}`} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <span className="font-mono text-sm">{p.number}</span>
                  <span className="text-slate-500 text-sm">{p.status}</span>
                </Link>
                {p.subject && <p className="text-sm text-slate-600 dark:text-slate-400 pl-3">{p.subject}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">Nenhum processo vinculado.</p>
        )}
      </div>
    </div>
  );
}
