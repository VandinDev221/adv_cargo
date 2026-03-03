import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { authRoutes } from './routes/auth.js';
import { processRoutes } from './routes/processes.js';
import { clientRoutes } from './routes/clients.js';
import { deadlineRoutes } from './routes/deadlines.js';
import { hearingRoutes } from './routes/hearings.js';
import { financialRoutes } from './routes/financial.js';
import { reportRoutes } from './routes/reports.js';
import { searchRoutes } from './routes/search.js';
import { logsRoutes } from './routes/logs.js';
import { usersRoutes } from './routes/users.js';
import { officesRoutes } from './routes/offices.js';
import { authMiddleware, devOnlyMiddleware } from './middleware/auth.js';
import { securityMiddleware } from './middleware/security.js';
import { rateLimitMiddleware, getClientIp } from './lib/rateLimit.js';
import { loadBlocklistFromDb } from './lib/blocklist.js';
import { securityRoutes } from './routes/security.js';
import { addRequest } from './lib/requestBuffer.js';
import { persistRequest } from './lib/requestLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

// Redireciona HTTP para HTTPS (produção ou quando atrás de proxy)
app.use((req, res, next) => {
  const proto = req.get('x-forwarded-proto');
  if (proto === 'http') {
    const host = req.get('host') || req.hostname;
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  next();
});

// HSTS e headers de segurança
app.use((req, res, next) => {
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'https://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Defesa: lista de bloqueio + detecção de ameaças (SQL injection, XSS, path traversal, etc.)
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  securityMiddleware(req, res, next);
});

// Rate limit por IP (exceto health) – evita sobrecarga e abuso
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  rateLimitMiddleware(req, res, next);
});

// Registra cada requisição (buffer em memória + banco, sem excluir nenhuma)
app.use('/api', (req, res, next) => {
  next();
  res.on('finish', () => {
    const ip = getClientIp(req);
    addRequest(req, res, ip, res.statusCode);
    persistRequest(req, ip, res.statusCode);
  });
});

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/processes', authMiddleware, processRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/deadlines', authMiddleware, deadlineRoutes);
app.use('/api/hearings', authMiddleware, hearingRoutes);
app.use('/api/financial', authMiddleware, financialRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/search', authMiddleware, searchRoutes);
app.use('/api/logs', authMiddleware, devOnlyMiddleware, logsRoutes);
app.use('/api/offices', authMiddleware, devOnlyMiddleware, officesRoutes);
app.use('/api/users', authMiddleware, devOnlyMiddleware, usersRoutes);
app.use('/api/security', authMiddleware, devOnlyMiddleware, securityRoutes);

app.get('/api/health', async (_, res) => {
  let db = 'ok';
  try {
    const { prisma } = await import('./lib/prisma.js');
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    db = 'error';
    console.error('[health] DB connection failed:', e?.message || e);
  }
  res.json({ ok: true, api: true, db });
});

const useHttps = process.env.USE_HTTPS === 'true' || process.env.USE_HTTPS === '1';
const sslKeyPath = process.env.SSL_KEY_PATH || process.env.HTTPS_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH || process.env.HTTPS_CERT_PATH;

function startServer() {
  if (useHttps && sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const server = https.createServer(
      {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      },
      app
    );
    server.listen(PORT, () => {
      console.log(`AdvCargo API (HTTPS) rodando em https://localhost:${PORT}`);
    });
  } else {
    const server = http.createServer(app);
    server.listen(PORT, () => {
      const scheme = isProduction ? 'https (use proxy ou USE_HTTPS)' : 'http';
      console.log(`AdvCargo API rodando em ${scheme}://localhost:${PORT}`);
    });
  }
}

loadBlocklistFromDb()
  .then((n) => {
    if (n > 0) console.log(`Segurança: ${n} IP(s) bloqueado(s) carregado(s).`);
    startServer();
  })
  .catch(() => startServer());
