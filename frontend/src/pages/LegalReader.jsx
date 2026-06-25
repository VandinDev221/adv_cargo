import { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  Users,
  CalendarClock,
  AlertCircle,
  ListChecks,
  Scale,
  Loader2,
  Lock,
} from 'lucide-react';
import { ai } from '../lib/api';

const EMPTY = {
  documentType: '',
  summary: '',
  parties: [],
  deadlines: [],
  keyPoints: [],
  suggestedActions: [],
  legalReferences: [],
};

export default function LegalReader() {
  const [mode, setMode] = useState('file');
  const [text, setText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [file, setFile] = useState(null);
  const [pdfPassword, setPdfPassword] = useState('');
  const [needsPdfPassword, setNeedsPdfPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [meta, setMeta] = useState(null);
  const fileRef = useRef(null);

  async function handleAnalyze(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAnalysis(null);
    setMeta(null);
    try {
      const data = await ai.analyzeDocument({
        file: mode === 'file' ? file : null,
        text: mode === 'text' ? text : '',
        instruction,
        pdfPassword: pdfPassword || undefined,
      });
      setAnalysis(data.analysis || EMPTY);
      setMeta(data.meta);
      setNeedsPdfPassword(false);
    } catch (err) {
      if (err.code === 'PDF_PASSWORD_REQUIRED' || err.code === 'PDF_PASSWORD_INVALID') {
        setNeedsPdfPassword(true);
      } else {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('senha') || msg.includes('password') || msg.includes('protegido') || msg.includes('extrair texto')) {
          setNeedsPdfPassword(true);
        }
      }
      setError(err.message || 'Erro ao analisar documento');
    } finally {
      setLoading(false);
    }
  }

  const showPasswordField = mode === 'file' && !!file;
  const canSubmit = mode === 'file' ? !!file : text.trim().length >= 30;

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500 shrink-0" />
          Leitor jurídico (IA)
        </h1>
        <p className="page-description mt-1">
          Envie um PDF ou texto e a IA resume partes, prazos e pontos de atenção do documento.
          PDFs protegidos por senha são suportados.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="panel panel-body space-y-4 shadow-sm">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'file'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Arquivo
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'text'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Colar texto
          </button>
        </div>

        {mode === 'file' ? (
          <div
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(ev) => ev.key === 'Enter' && fileRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(ev) => {
                setFile(ev.target.files?.[0] || null);
                setPdfPassword('');
                setNeedsPdfPassword(false);
              }}
            />
            <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            {file ? (
              <p className="font-medium text-slate-800 dark:text-slate-200">{file.name}</p>
            ) : (
              <>
                <p className="font-medium text-slate-700 dark:text-slate-300">Clique para enviar PDF ou TXT</p>
                <p className="text-sm text-slate-500 mt-1">Máximo 8 MB</p>
              </>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Texto do documento
            </label>
            <textarea
              value={text}
              onChange={(ev) => setText(ev.target.value)}
              rows={10}
              placeholder="Cole aqui o conteúdo da petição, sentença, contrato..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-base sm:text-sm font-mono min-h-[200px] sm:min-h-0"
            />
          </div>
        )}

        {showPasswordField && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Senha do documento {needsPdfPassword ? '(obrigatória)' : '(se o PDF estiver protegido)'}
            </label>
            <input
              type="password"
              value={pdfPassword}
              onChange={(ev) => setPdfPassword(ev.target.value)}
              placeholder="Informe a senha de abertura do PDF"
              autoComplete="off"
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 ${
                needsPdfPassword
                  ? 'border-amber-400 dark:border-amber-500 ring-1 ring-amber-400/50'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {needsPdfPassword && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Este documento exige senha para leitura. Digite a senha e clique em Analisar novamente.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Instrução adicional (opcional)
          </label>
          <input
            type="text"
            value={instruction}
            onChange={(ev) => setInstruction(ev.target.value)}
            placeholder="Ex: foque nos prazos processuais e honorários"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
            maxLength={500}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analisando com Groq...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analisar documento
            </>
          )}
        </button>
      </form>

      {analysis && (
        <div className="space-y-4">
          {meta?.charsAnalyzed && (
            <p className="text-xs text-slate-400">{meta.charsAnalyzed.toLocaleString('pt-BR')} caracteres analisados</p>
          )}

          <section className="panel panel-body rounded-2xl">
            <h2 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-2">
              <FileText className="w-5 h-5 text-primary-500" />
              Tipo de documento
            </h2>
            <p className="text-slate-700 dark:text-slate-300 capitalize">{analysis.documentType || '—'}</p>
          </section>

          <section className="panel panel-body rounded-2xl">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Resumo</h2>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{analysis.summary}</p>
          </section>

          {analysis.parties?.length > 0 && (
            <section className="panel panel-body rounded-2xl">
              <h2 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-3">
                <Users className="w-5 h-5 text-primary-500" />
                Partes
              </h2>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {analysis.parties.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.deadlines?.length > 0 && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-5 bg-amber-50/50 dark:bg-amber-900/10">
              <h2 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-3">
                <CalendarClock className="w-5 h-5 text-amber-600" />
                Prazos identificados
              </h2>
              <ul className="space-y-2">
                {analysis.deadlines.map((d, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{d.description}</span>
                    {d.date && <span className="text-amber-700 dark:text-amber-400 ml-2">— {d.date}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {analysis.keyPoints?.length > 0 && (
            <section className="panel panel-body rounded-2xl">
              <h2 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-3">
                <AlertCircle className="w-5 h-5 text-primary-500" />
                Pontos de atenção
              </h2>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {analysis.keyPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.suggestedActions?.length > 0 && (
            <section className="panel panel-body rounded-2xl">
              <h2 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-3">
                <ListChecks className="w-5 h-5 text-emerald-600" />
                Ações sugeridas
              </h2>
              <ul className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {analysis.suggestedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.legalReferences?.length > 0 && (
            <section className="panel panel-body rounded-2xl">
              <h2 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-3">
                <Scale className="w-5 h-5 text-primary-500" />
                Referências legais
              </h2>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-sm">
                {analysis.legalReferences.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-slate-400 text-center pb-4">
            Análise gerada por IA (Groq). Revise sempre antes de tomar decisões jurídicas.
          </p>
        </div>
      )}
    </div>
  );
}
