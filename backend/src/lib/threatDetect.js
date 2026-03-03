/**
 * Detecção de padrões de ataque para defender o sistema.
 * Não bloqueia sozinho: registra em ThreatLog e opcionalmente permite bloqueio manual/automático.
 */

const PATTERNS = {
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|EXECUTE|SCRIPT)\b)/i,
    /(\bOR\s+['"]?1['"]?\s*=\s*['"]?1)/i,
    /('|\\)\s*(OR|AND)\s*('|\\)/i,
    /;\s*(DROP|DELETE|INSERT)/i,
    /(\%\27|\%22|\%3B)/i, // ' " ;
  ],
  xss: [
    /<script\b[^>]*>/i,
    /javascript\s*:/i,
    /on\w+\s*=\s*["'][^"']*["']/i,  // onclick=, onerror=
    /<iframe/i,
    /vbscript\s*:/i,
    /expression\s*\(/i,
  ],
  pathTraversal: [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e\//i,
  ],
  suspicious: [
    /etc\/passwd/i,
    /proc\/self/i,
    /\.env\b/i,
    /wp-admin|wp-login/i,
    /\.git\//i,
    /admin\.php|shell\.php/i,
  ],
};

function checkString(str, type) {
  if (!str || typeof str !== 'string') return null;
  const patterns = PATTERNS[type];
  if (!patterns) return null;
  for (const p of patterns) {
    if (p.test(str)) return type;
  }
  return null;
}

/**
 * Analisa a requisição e retorna o tipo de ameaça detectado (ou null).
 */
export function detectThreat(req) {
  const path = req.originalUrl || req.path || '';
  const query = req.url?.split('?')[1] || '';
  const decodedPath = tryDecode(path);
  const decodedQuery = tryDecode(query);
  const body = req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : '';

  const toScan = [decodedPath, decodedQuery, body].filter(Boolean).join(' ');
  if (!toScan) return null;

  if (checkString(toScan, 'sqlInjection')) return 'sql_injection';
  if (checkString(toScan, 'xss')) return 'xss';
  if (checkString(toScan, 'pathTraversal')) return 'path_traversal';
  if (checkString(toScan, 'suspicious')) return 'suspicious_pattern';
  return null;
}

function tryDecode(s) {
  if (!s) return '';
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Registra ameaça no banco (fire-and-forget).
 */
export function logThreat(req, ip, threatType, payloadSnippet) {
  const snippet = typeof payloadSnippet === 'string' ? payloadSnippet.slice(0, 2000) : null;
  import('./prisma.js')
    .then(({ prisma }) => {
      if (!prisma.threatLog) return;
      return prisma.threatLog.create({
        data: {
          ip: ip || null,
          path: req.originalUrl || req.path || null,
          method: req.method || null,
          threatType,
          payload: snippet,
        },
      });
    })
    .catch((e) => console.error('ThreatLog create error', e.message));
}
