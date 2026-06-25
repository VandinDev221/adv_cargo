import pdf from 'pdf-parse';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/plain',
]);

const ALLOWED_EXT = /\.(pdf|txt)$/i;

export function isPdfFile(file) {
  if (!file) return false;
  const name = (file.originalname || '').toLowerCase();
  return file.mimetype === 'application/pdf' || name.endsWith('.pdf');
}

export function isAllowedDocument(file) {
  if (!file) return false;
  if (ALLOWED_MIME.has(file.mimetype)) return true;
  return ALLOWED_EXT.test(file.originalname || '');
}

function pdfPasswordError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function isPdfPasswordError(message = '') {
  const m = message.toLowerCase();
  return (
    m.includes('password')
    || m.includes('encrypted')
    || m.includes('senha')
    || m.includes('needs a password')
    || m.includes('no password')
  );
}

export async function extractTextFromFile(file, { pdfPassword } = {}) {
  if (!file?.buffer?.length) {
    throw new Error('Arquivo vazio ou inválido');
  }

  const name = (file.originalname || '').toLowerCase();
  const isPdf = isPdfFile(file);

  if (isPdf) {
    try {
      const options = pdfPassword ? { password: pdfPassword } : {};
      const parsed = await pdf(file.buffer, options);
      const text = parsed.text?.trim();
      if (!text) {
        throw new Error('Não foi possível extrair texto do PDF (pode ser imagem escaneada ou senha incorreta)');
      }
      return text;
    } catch (e) {
      if (e.code === 'PDF_PASSWORD_REQUIRED' || e.code === 'PDF_PASSWORD_INVALID') throw e;
      const msg = e?.message || '';
      if (isPdfPasswordError(msg)) {
        if (!pdfPassword) {
          throw pdfPasswordError(
            'Este PDF está protegido por senha. Informe a senha para continuar.',
            'PDF_PASSWORD_REQUIRED',
          );
        }
        throw pdfPasswordError('Senha do PDF incorreta.', 'PDF_PASSWORD_INVALID');
      }
      throw e;
    }
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
