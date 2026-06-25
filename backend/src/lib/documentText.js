import pdf from 'pdf-parse';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/plain',
]);

const ALLOWED_EXT = /\.(pdf|txt)$/i;

export function isAllowedDocument(file) {
  if (!file) return false;
  if (ALLOWED_MIME.has(file.mimetype)) return true;
  return ALLOWED_EXT.test(file.originalname || '');
}

export async function extractTextFromFile(file) {
  if (!file?.buffer?.length) {
    throw new Error('Arquivo vazio ou inválido');
  }

  const name = (file.originalname || '').toLowerCase();
  const isPdf = file.mimetype === 'application/pdf' || name.endsWith('.pdf');

  if (isPdf) {
    const parsed = await pdf(file.buffer);
    const text = parsed.text?.trim();
    if (!text) throw new Error('Não foi possível extrair texto do PDF (pode ser imagem escaneada)');
    return text;
  }

  if (file.mimetype === 'text/plain' || name.endsWith('.txt')) {
    return file.buffer.toString('utf-8').trim();
  }

  throw new Error('Formato não suportado. Use PDF ou TXT.');
}

export function validateExtractedText(text) {
  const trimmed = (text || '').trim();
  if (trimmed.length < 30) {
    throw new Error('Texto muito curto para análise (mínimo ~30 caracteres)');
  }
  if (trimmed.length > 100_000) {
    throw new Error('Documento muito longo. Divida em partes menores.');
  }
  return trimmed;
}
