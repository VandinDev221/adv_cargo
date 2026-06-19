/**
 * Rate limiter por IP: limita quantidade de requisições por janela de tempo
 * para evitar sobrecarga e abuso.
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS_PER_IP = 300;  // máx. requisições por IP por janela

const store = new Map(); // ip -> { count, resetAt }
const blockedIps = new Set(); // IPs que atingiram o limite nesta janela

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function cleanup() {
  const now = Date.now();
  for (const [ip, data] of store.entries()) {
    if (now > data.resetAt) store.delete(ip);
  }
  if (store.size === 0) blockedIps.clear();
}

export async function rateLimitMiddleware(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();

  let data = store.get(ip);
  if (!data || now > data.resetAt) {
    data = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ip, data);
  }
  data.count += 1;

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_IP);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_IP - data.count));

  if (data.count > MAX_REQUESTS_PER_IP) {
    blockedIps.add(ip);
    try {
      const { logAction } = await import('./logger.js');
      await logAction({
      user: null,
      action: 'rate_limit.exceeded',
      req: { ip, path: req.originalUrl || req.path, method: req.method, headers: req.headers },
      payload: { ip, path: req.originalUrl || req.path, count: data.count, max: MAX_REQUESTS_PER_IP },
      });
    } catch (_) {}
    const retryAfter = Math.ceil((data.resetAt - Date.now()) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    try {
      const { addRequest } = await import('./requestBuffer.js');
      addRequest(req, res, ip, 429);
    } catch (_) {}
    try {
      const { persistRequest } = await import('./requestLog.js');
      persistRequest(req, ip, 429);
    } catch (_) {}
    return res.status(429).json({
      error: 'Muitas requisições. Tente novamente mais tarde.',
      retryAfter,
    });
  }
  next();
}

/** Retorna estatísticas para o monitoramento (por IP e bloqueados) */
export function getRateLimitStats() {
  cleanup();
  const byIp = {};
  for (const [ip, data] of store.entries()) {
    byIp[ip] = data.count;
  }
  return {
    byIp,
    blockedIps: [...blockedIps],
    windowMs: WINDOW_MS,
    maxPerIp: MAX_REQUESTS_PER_IP,
  };
}

export { getClientIp };
