import { getClientIp } from '../lib/rateLimit.js';
import { isBlocked } from '../lib/blocklist.js';
import { detectThreat, logThreat } from '../lib/threatDetect.js';

/**
 * Bloqueia IPs na lista e rejeita requisições que parecem ataque.
 */
export function securityMiddleware(req, res, next) {
  const ip = getClientIp(req);

  if (isBlocked(ip)) {
    return res.status(403).json({ error: 'Acesso bloqueado por segurança.' });
  }

  const threatType = detectThreat(req);
  if (threatType) {
    const payloadSnippet = [req.originalUrl, req.url, req.body ? JSON.stringify(req.body).slice(0, 500) : ''].join(' ');
    logThreat(req, ip, threatType, payloadSnippet);
    return res.status(403).json({ error: 'Requisição suspeita bloqueada.' });
  }

  next();
}
