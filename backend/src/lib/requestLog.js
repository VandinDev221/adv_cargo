/**
 * Persiste cada requisição no banco (RequestLog) sem bloquear a resposta.
 * Nenhuma requisição é excluída.
 */
function truncate(str, max = 500) {
  if (!str) return null;
  const s = String(str);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export function persistRequest(req, ip, statusCode) {
  const path = req.originalUrl || req.path || '';
  const userAgent = truncate(req.headers['user-agent'], 500);
  import('./prisma.js')
    .then(({ prisma }) =>
      prisma.requestLog.create({
        data: {
          ip: ip || null,
          method: req.method || null,
          path: path || null,
          statusCode: statusCode || null,
          userAgent,
        },
      })
    )
    .catch((e) => console.error('RequestLog create error', e.message));
}
