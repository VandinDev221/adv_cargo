#!/usr/bin/env node
/**
 * Script: desbloquear IP.
 * Uso: node scripts/unblock-ip.js <IP>
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { removeFromBlocklist } from '../src/lib/blocklist.js';

const ip = process.argv[2];
if (!ip?.trim()) {
  console.error('Uso: node scripts/unblock-ip.js <IP>');
  process.exit(1);
}

const normalized = String(ip).trim();
removeFromBlocklist(normalized);
prisma.blockedIp
  .deleteMany({ where: { ip: normalized } })
  .then((r) => {
    console.log(r.count ? `IP desbloqueado: ${normalized}` : `IP não estava na lista: ${normalized}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
