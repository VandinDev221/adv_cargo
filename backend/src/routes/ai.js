import { Router } from 'express';
import multer from 'multer';
import { analyzeLegalDocument } from '../lib/groq.js';
import { extractTextFromFile, isAllowedDocument, validateExtractedText } from '../lib/documentText.js';
import { logAction } from '../lib/logger.js';

export const aiRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (isAllowedDocument(file)) return cb(null, true);
    cb(new Error('Formato não suportado. Envie PDF ou TXT.'));
  },
});

aiRoutes.post('/analyze-document', upload.single('file'), async (req, res) => {
  try {
    let text = (req.body?.text || '').trim();
    const instruction = (req.body?.instruction || '').trim().slice(0, 500);

    if (req.file) {
      text = await extractTextFromFile(req.file);
    }

    text = validateExtractedText(text);

    const analysis = await analyzeLegalDocument(text, { instruction });

    await logAction({
      user: { id: req.user.id, officeId: req.user.officeId },
      action: 'ai.analyze_document',
      req,
      payload: {
        source: req.file ? 'file' : 'text',
        fileName: req.file?.originalname,
        chars: text.length,
        documentType: analysis.documentType,
      },
    });

    res.json({ analysis, meta: { charsAnalyzed: text.length } });
  } catch (e) {
    const status = e.message?.includes('GROQ_API_KEY') ? 503
      : e.message?.includes('suportado') || e.message?.includes('curto') || e.message?.includes('longo') ? 400
      : 500;
    console.error('[ai] analyze-document:', e?.message || e);
    res.status(status).json({ error: e.message || 'Erro ao analisar documento' });
  }
});
