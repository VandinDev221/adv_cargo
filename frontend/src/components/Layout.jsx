import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Scale,
  Users,
  CalendarClock,
  Calendar,
  Wallet,
  BarChart3,
  Search,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  FileText,
  UserCog,
  List,
  Shield,
} from 'lucide-react';
import { search as searchApi } from '../lib/api';

const baseNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/processos', icon: Scale, label: 'Processos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/prazos', icon: CalendarClock, label: 'Prazos' },
  { to: '/audiencias', icon: Calendar, label: 'Audiências' },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setSearchResults(null);
      return;
    }
    try {
      const data = await searchApi.global(q);
      setSearchResults(data);
    } catch {
      setSearchResults({ processes: [], clients: [], deadlines: [] });
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQ), 200);
    return () => clearTimeout(t);
  }, [searchQ, doSearch]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const goTo = (path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQ('');
    setSearchResults(null);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 w-full max-w-md mx-4 text-left"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1">Buscar processos, clientes... </span>
          <kbd>Ctrl+K</kbd>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label={dark ? 'Modo claro' : 'Modo escuro'}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-400">{user?.name}</span>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-20 w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
            transform transition-transform duration-200 ease-out pt-14 md:pt-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <nav className="p-3 space-y-1">
            {[
              ...baseNav,
              ...(user?.role === 'dev'
                ? [
                    { to: '/usuarios', icon: UserCog, label: 'Usuários' },
                    { to: '/logs', icon: FileText, label: 'Logs do sistema' },
                    { to: '/logs/todos', icon: List, label: 'Todos os logs' },
                    { to: '/defesa', icon: Shield, label: 'Defesa e ameaças' },
                  ]
                : []),
            ].map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Modal busca global */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50" onClick={() => setSearchOpen(false)}>
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400 ml-4" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Digite para buscar processos, clientes, prazos..."
                className="flex-1 px-3 py-4 bg-transparent outline-none"
                autoFocus
              />
              <kbd className="mr-4">ESC</kbd>
            </div>
            {searchResults && (
              <div className="max-h-80 overflow-auto p-2">
                {searchResults.processes?.length > 0 && (
                  <div className="mb-2">
                    <p className="px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">Processos</p>
                    {searchResults.processes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => goTo(`/processos/${p.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <span className="font-medium">{p.number}</span>
                        {p.subject && <span className="text-slate-500 dark:text-slate-400 ml-2">{p.subject}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.clients?.length > 0 && (
                  <div className="mb-2">
                    <p className="px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">Clientes</p>
                    {searchResults.clients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => goTo(`/clientes/${c.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {c.name} <span className="text-slate-500">{c.document}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.deadlines?.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">Prazos</p>
                    {searchResults.deadlines.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => goTo('/prazos')}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {d.title} {d.process?.number && `• ${d.process.number}`}
                      </button>
                    ))}
                  </div>
                )}
                {searchQ.length >= 2 && searchResults && !searchResults.processes?.length && !searchResults.clients?.length && !searchResults.deadlines?.length && (
                  <p className="px-4 py-6 text-slate-500 text-center">Nenhum resultado encontrado.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
