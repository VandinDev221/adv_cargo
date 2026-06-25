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
  Sparkles,
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
  { to: '/leitor-juridico', icon: Sparkles, label: 'Leitor jurídico' },
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

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', sidebarOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [sidebarOpen]);

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
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSidebarOpen(false);
      }
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

  const navItems = [
    ...baseNav,
    ...(user?.role === 'dev'
      ? [
          { to: '/usuarios', icon: UserCog, label: 'Usuários' },
          { to: '/logs', icon: FileText, label: 'Logs do sistema' },
          { to: '/logs/todos', icon: List, label: 'Todos os logs' },
          { to: '/defesa', icon: Shield, label: 'Defesa e ameaças' },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm safe-top">
        {/* Linha principal */}
        <div className="flex items-center gap-2 h-12 sm:h-14 px-3 sm:px-4">
          <button
            type="button"
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0" onClick={() => setSidebarOpen(false)}>
            <Scale className="w-5 h-5 text-primary-500 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-white text-sm sm:text-base truncate">AdvCargo</span>
          </Link>

          {/* Busca desktop */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex-1 min-w-0 max-w-md mx-4 text-left"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate text-sm">Buscar processos, clientes...</span>
            <kbd className="hidden lg:inline-flex">Ctrl+K</kbd>
          </button>

          <div className="flex-1 md:flex-none" />

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label={dark ? 'Modo claro' : 'Modo escuro'}
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <span className="hidden lg:inline text-sm text-slate-600 dark:text-slate-400 max-w-[120px] truncate px-1">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400"
              aria-label="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Busca mobile */}
        <div className="px-3 pb-2 md:hidden">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-left text-sm"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="truncate">Buscar processos, clientes...</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100dvh-3rem)] sm:min-h-[calc(100dvh-3.5rem)]">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-20 w-64 max-w-[85vw] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
            transform transition-transform duration-200 ease-out
            flex flex-col
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ top: 0 }}
        >
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 safe-bottom pt-14 md:pt-3">
            <div className="md:hidden mb-2 px-3 py-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Menu</p>
              {user?.name && <p className="text-sm text-slate-600 dark:text-slate-300 truncate mt-0.5">{user.name}</p>}
            </div>
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm sm:text-base"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 overflow-auto safe-bottom">
          <Outlet />
        </main>
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Modal busca global */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-start justify-center pt-4 sm:pt-[12vh] px-3 sm:px-4 bg-black/50"
          onClick={() => setSearchOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden max-h-[85dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Busca global"
          >
            <div className="flex items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
              <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Buscar processos, clientes, prazos..."
                className="flex-1 min-w-0 px-3 py-3.5 sm:py-4 bg-transparent outline-none text-base sm:text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="mr-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 sm:hidden"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
              <kbd className="hidden sm:inline mr-4">ESC</kbd>
            </div>
            {searchResults && (
              <div className="overflow-y-auto flex-1 p-2">
                {searchResults.processes?.length > 0 && (
                  <div className="mb-2">
                    <p className="px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">Processos</p>
                    {searchResults.processes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => goTo(`/processos/${p.id}`)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <span className="font-medium font-mono text-sm">{p.number}</span>
                        {p.subject && <span className="text-slate-500 dark:text-slate-400 ml-2 text-sm">{p.subject}</span>}
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
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {c.name} <span className="text-slate-500 text-sm">{c.document}</span>
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
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
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
