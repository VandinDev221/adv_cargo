/**
 * Lista de IPs bloqueados. Verificação em memória + banco.
 * IPs são normalizados para que 127.0.0.1, ::1, ::ffff:127.0.0.1 coincidam.
 */
const memoryBlock = new Set();

/** Normaliza IP para comparação (IPv6 loopback -> 127.0.0.1, remove porta, etc.) */
function normalizeIp(ip) {
  if (!ip || typeof ip !== 'string') return '';
  let s = String(ip).trim();
  // Remove porta se existir (ex: 192.168.1.1:8080)
  const idx = s.lastIndexOf(':');
  if (idx > 0) {
    const after = s.slice(idx + 1);
    if (/^\d+$/.test(after)) s = s.slice(0, idx);
  }
  if (s === '::1' || s === '::') return '127.0.0.1';
  if (s.startsWith('::ffff:')) return s.slice(7); // ::ffff:192.168.1.1 -> 192.168.1.1
  return s;
}

export function addToBlocklist(ip) {
  const n = normalizeIp(ip);
  if (n) memoryBlock.add(n);
}

export function removeFromBlocklist(ip) {
  const n = normalizeIp(ip);
  if (n) memoryBlock.delete(n);
}

export function isBlocked(ip) {
  const n = normalizeIp(ip);
  if (!n) return false;
  if (memoryBlock.has(n)) return true;
  // Também verifica se o IP original está na lista (ex: usuário bloqueou "::1")
  return [...memoryBlock].some((blocked) => normalizeIp(blocked) === n || blocked === ip?.trim());
}

export function getMemoryBlocklist() {
  return [...memoryBlock];
}

/**
 * Carrega IPs bloqueados do banco para a memória (chamar na inicialização).
 * Limpa a lista em memória antes de carregar para refletir exatamente o banco.
 */
export async function loadBlocklistFromDb() {
  try {
    memoryBlock.clear();
    const { prisma } = await import('./prisma.js');
    if (!prisma.blockedIp) {
      console.warn('Prisma client sem modelo BlockedIp. Execute: npx prisma generate');
      return 0;
    }
    const list = await prisma.blockedIp.findMany({ select: { ip: true } });
    list.forEach((r) => memoryBlock.add(normalizeIp(r.ip) || r.ip));
    return list.length;
  } catch (e) {
    console.error('loadBlocklistFromDb', e.message);
    return 0;
  }
}
