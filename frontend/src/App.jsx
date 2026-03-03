import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Processes from './pages/Processes';
import ProcessDetail from './pages/ProcessDetail';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Deadlines from './pages/Deadlines';
import Hearings from './pages/Hearings';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import LogsTodos from './pages/LogsTodos';
import Users from './pages/Users';
import Security from './pages/Security';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900"><div className="animate-pulse text-slate-500">Carregando...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="processos" element={<Processes />} />
        <Route path="processos/:id" element={<ProcessDetail />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="clientes/:id" element={<ClientDetail />} />
        <Route path="prazos" element={<Deadlines />} />
        <Route path="audiencias" element={<Hearings />} />
        <Route path="financeiro" element={<Financial />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="logs" element={<Logs />} />
        <Route path="logs/todos" element={<LogsTodos />} />
        <Route path="defesa" element={<Security />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
