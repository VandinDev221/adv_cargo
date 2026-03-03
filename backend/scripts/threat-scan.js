#!/usr/bin/env node
/**
 * Script: scan de IPs suspeitos (sugestão para bloqueio).
 * Analisa logs e retorna IPs com pontuação de risco.
 * Uso: node scripts/threat-scan.js [horas]
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

const hours = parseInt(process.argv[2], 10) || 24;
const since = new Date(Date.now() - hours * 60 * 60 * 1000);

async function run() {
  const [failedByIp, rateLimitByIp, threatByIp, blocked] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ['ip'],
      where: { action: 'auth.login_failed', createdAt: { gte: since }, ip: { not: null } },
      _count: { id: true },
    }),
    prisma.auditLog.groupBy({
      by: ['ip'],
      where: { action: 'rate_limit.exceeded', createdAt: { gte: since }, ip: { not: null } },
      _count: { id: true },
    }),
    prisma.threatLog.groupBy({
      by: ['ip'],
      where: { createdAt: { gte: since }, ip: { not: null } },
      _count: { id: true },
    }),
    prisma.blockedIp.findMany({ select: { ip: true } }),
  ]);

  const blockedSet = new Set(blocked.map((b) => b.ip));
  const score = {};
  failedByIp.forEach((r) => { score[r.ip] = (score[r.ip] || 0) + r._count.id * 2; });
  rateLimitByIp.forEach((r) => { score[r.ip] = (score[r.ip] || 0) + r._count.id * 3; });
  threatByIp.forEach((r) => { score[r.ip] = (score[r.ip] || 0) + r._count.id * 10; });

  const suggested = Object.entries(score)
    .filter(([ip]) => !blockedSet.has(ip) && score[ip] >= 5)
    .map(([ip, s]) => ({ ip, score: s }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  console.log('--- Scan de ameaças (sugestão de bloqueio) ---');
  console.log('Período:', since.toISOString(), 'até agora');
  console.log('');
  if (suggested.length === 0) {
    console.log('Nenhum IP suspeito acima do limiar (score >= 5).');
  } else {
    console.log('IPs sugeridos para bloqueio (score >= 5):');
    suggested.forEach(({ ip, score: s }) => console.log('  ', ip, 'score:', s));
    console.log('');
    console.log('Para bloquear: node scripts/block-ip.js <IP> [motivo]');
  }
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
