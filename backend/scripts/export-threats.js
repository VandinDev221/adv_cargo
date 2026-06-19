#!/usr/bin/env node
/**
 * Script: exportar ameaças para JSON/CSV (rastreamento e análise).
 * Uso: node scripts/export-threats.js [horas] [formato]
 * formato: json (padrão) ou csv
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hours = parseInt(process.argv[2], 10) || 24;
const format = (process.argv[3] || 'json').toLowerCase();
const since = new Date(Date.now() - hours * 60 * 60 * 1000);

async function run() {
  const [threats, failedLogins, rateLimit] = await Promise.all([
    prisma.threatLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.findMany({
      where: { action: 'auth.login_failed', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.findMany({
      where: { action: 'rate_limit.exceeded', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const outDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const base = `threats-${since.toISOString().slice(0, 10)}-${Date.now()}`;

  if (format === 'csv') {
    const csvRows = ['tipo,ip,data,caminho,metodo,payload'];
    threats.forEach((t) => {
      const payload = (t.payload || '').replace(/"/g, '""').replace(/\n/g, ' ');
      csvRows.push(`threat,${t.ip || ''},${t.createdAt.toISOString()},${(t.path || '').replace(/,/g, ';')},${t.method || ''},"${payload}"`);
    });
    failedLogins.forEach((l) => {
      csvRows.push(`login_failed,${l.ip || ''},${l.createdAt.toISOString()},,,`);
    });
    rateLimit.forEach((r) => {
      csvRows.push(`rate_limit,${r.ip || ''},${r.createdAt.toISOString()},,,`);
    });
    const file = path.join(outDir, `${base}.csv`);
    fs.writeFileSync(file, '\ufeff' + csvRows.join('\n'), 'utf8');
    console.log('Exportado:', file);
  } else {
    const data = { since: since.toISOString(), threats, failedLogins, rateLimit };
    const file = path.join(outDir, `${base}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log('Exportado:', file);
  }
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
