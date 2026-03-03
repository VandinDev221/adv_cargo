/**
 * Buffer em memória das últimas requisições para monitoramento em tempo real.
 */
const MAX_SIZE = 200;
const buffer = [];

function truncate(str, max = 120) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function addRequest(req, res, ip, statusCode) {
  const entry = {
    ip,
    method: req.method,
    path: req.originalUrl || req.path || '',
    statusCode: statusCode || res.statusCode,
    timestamp: new Date().toISOString(),
    userAgent: truncate(req.headers['user-agent'] || '', 80),
  };
  buffer.unshift(entry);
  if (buffer.length > MAX_SIZE) buffer.pop();
}

export function getRecentRequests(limit = 50) {
  return buffer.slice(0, limit);
}
