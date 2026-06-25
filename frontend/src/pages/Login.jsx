import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale } from 'lucide-react';
import GoogleLoginButton, { isGoogleLoginEnabled } from '../components/GoogleLoginButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleEnabled = isGoogleLoginEnabled();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(response) {
    if (!response.credential) {
      setError('Não foi possível obter credencial do Google');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao entrar com Google');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scale className="w-10 h-10 text-primary-500" />
          <span className="text-2xl font-bold text-slate-800 dark:text-white">AdvCargo</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
          <h1 className="text-xl font-semibold text-center text-slate-800 dark:text-white">Entrar</h1>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {googleEnabled && (
            <>
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Erro ao entrar com Google')}
                disabled={loading}
                text="signin_with"
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">ou</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar com e-mail'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Não tem conta? <Link to="/register" className="text-primary-600 hover:underline">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
