import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, Mail, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { sendRegisterCode, verifyRegister, resendRegisterCode } = useAuth();
  const navigate = useNavigate();

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendRegisterCode({ name, email, password, officeName: officeName || name });
      setStep(2);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyRegister({ email, code });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await resendRegisterCode(email);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Erro ao reenviar código');
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

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
            <h1 className="text-xl font-semibold text-center text-slate-800 dark:text-white">Criar conta</h1>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
              Enviaremos um código de verificação para o seu e-mail.
            </p>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do escritório (opcional)</label>
              <input
                type="text"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="Ex: Silva & Advogados"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Já tem conta? <Link to="/login" className="text-primary-600 hover:underline">Entrar</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30">
                <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-center text-slate-800 dark:text-white">Verifique seu e-mail</h1>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
              Digite o código de 6 dígitos enviado para <strong className="text-slate-700 dark:text-slate-300">{email}</strong>
            </p>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-center text-2xl tracking-[0.5em] font-mono"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Confirmar cadastro'}
            </button>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="w-full py-2 text-sm text-primary-600 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Reenviar código em ${resendCooldown}s` : 'Reenviar código'}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setCode(''); setError(''); }}
                className="flex items-center justify-center gap-1 w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
