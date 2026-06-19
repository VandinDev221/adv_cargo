#!/usr/bin/env node
/**
 * Script: bloquear IP por ameaça ou decisão administrativa.
 * Uso: node scripts/block-ip.js <IP> [motivo]
 * Ex: node scripts/block-ip.js 192.168.1.100 "tentativa sql injection"
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { addToBlocklist } from '../src/lib/blocklist.js';

const ip = process.argv[2];
const reason = process.argv[3] || 'Script/bloqueio manual';

if (!ip?.trim()) {
  console.error('Uso: node scripts/block-ip.js <IP> [motivo]');
  process.exit(1);
}

const normalized = String(ip).trim();
addToBlocklist(normalized);
prisma.blockedIp
  .upsert({
    where: { ip: normalized },
    update: { reason },
    create: { ip: normalized, reason },
  })
  .then(() => {
    console.log('IP bloqueado:', normalized);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
