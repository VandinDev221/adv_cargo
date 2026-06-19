#!/usr/bin/env node
/**
 * Script: relatório de ameaças (últimas 24h por padrão).
 * Uso: node scripts/threat-report.js [horas]
 * Ex: node scripts/threat-report.js 48
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

const hours = parseInt(process.argv[2], 10) || 24;
const since = new Date(Date.now() - hours * 60 * 60 * 1000);

async function run() {
  const [threats, failedLogins, rateLimit, blocked] = await Promise.all([
    prisma.threatLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.auditLog.findMany({
      where: { action: 'auth.login_failed', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.auditLog.findMany({
      where: { action: 'rate_limit.exceeded', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  console.log('--- Relatório de ameaças ---');
  console.log('Período:', since.toISOString(), 'até agora');
  console.log('');
  console.log('IPs bloqueados:', blocked.length);
  blocked.forEach((b) => console.log('  ', b.ip, b.reason || ''));
  console.log('');
  console.log('Ameaças detectadas (ThreatLog):', threats.length);
  const byType = {};
  threats.forEach((t) => { byType[t.threatType] = (byType[t.threatType] || 0) + 1; });
  console.log('  Por tipo:', byType);
  threats.slice(0, 10).forEach((t) => console.log('  ', t.createdAt.toISOString(), t.ip, t.threatType, (t.path || '').slice(0, 60)));
  console.log('');
  console.log('Tentativas de login falhas:', failedLogins.length);
  const failByIp = {};
  failedLogins.forEach((l) => { failByIp[l.ip] = (failByIp[l.ip] || 0) + 1; });
  const topFail = Object.entries(failByIp).sort((a, b) => b[1] - a[1]).slice(0, 10);
  topFail.forEach(([ip, c]) => console.log('  ', ip, c));
  console.log('');
  console.log('Rate limit excedido:', rateLimit.length);
  const rlByIp = {};
  rateLimit.forEach((l) => { rlByIp[l.ip] = (rlByIp[l.ip] || 0) + 1; });
  Object.entries(rlByIp).slice(0, 10).forEach(([ip, c]) => console.log('  ', ip, c));
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
