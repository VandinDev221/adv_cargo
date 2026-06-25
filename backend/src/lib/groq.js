const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MAX_INPUT_CHARS = 28_000;

const LEGAL_SYSTEM_PROMPT = `Você é um assistente jurídico especializado em direito brasileiro.
Analise o documento fornecido e responda SOMENTE com um JSON válido (sem markdown, sem texto fora do JSON), neste formato exato:
{
  "documentType": "tipo do documento (ex: petição inicial, sentença, contrato, procuração)",
  "summary": "resumo objetivo em 2-4 parágrafos",
  "parties": ["parte 1", "parte 2"],
  "deadlines": [{"description": "descrição do prazo", "date": "data se identificada ou null"}],
  "keyPoints": ["ponto importante 1", "ponto importante 2"],
  "suggestedActions": ["ação sugerida para o advogado 1", "ação 2"],
  "legalReferences": ["artigo, lei ou jurisprudência citada, se houver"]
}
Se algum campo não puder ser identificado, use array vazio [] ou string vazia.
Seja preciso, use linguagem técnica jurídica brasileira e não invente informações ausentes no texto.`;

export function truncateText(text, max = MAX_INPUT_CHARS) {
  if (!text || text.length <= max) return text || '';
  return `${text.slice(0, max)}\n\n[... texto truncado por limite de tamanho ...]`;
}

export async function analyzeLegalDocument(text, { instruction } = {}) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY não configurada no servidor');
  }

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
  const userContent = instruction
    ? `Instrução adicional do advogado: ${instruction}\n\n---\n\nDocumento:\n${truncateText(text)}`
    : `Documento:\n${truncateText(text)}`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: LEGAL_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Groq API erro ${res.status}`;
    throw new Error(msg);
  }

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Resposta vazia da IA');

  try {
    return JSON.parse(raw);
  } catch {
    return {
      documentType: 'Não identificado',
      summary: raw,
      parties: [],
      deadlines: [],
      keyPoints: [],
      suggestedActions: [],
      legalReferences: [],
    };
  }
}
