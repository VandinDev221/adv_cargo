#!/usr/bin/env node
/**
 * Verifica a conexão com o banco de dados (PostgreSQL local ou Neon).
 * Uso: node scripts/check-db.js
 * Requer: DATABASE_URL no .env ou no ambiente
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

async function check() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Erro: DATABASE_URL não definida. Configure no .env ou no ambiente.');
    process.exit(1);
  }

  const safeUrl = url.replace(/:[^:@]+@/, ':****@');
  console.log('Verificando conexão...');
  console.log('URL (oculta):', safeUrl);
  console.log('');

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Conexão OK.');

    const [users, offices, processes] = await Promise.all([
      prisma.user.count(),
      prisma.office.count(),
      prisma.process.count(),
    ]);
    console.log('');
    console.log('Dados no banco:');
    console.log('  Usuários:', users);
    console.log('  Escritórios:', offices);
    console.log('  Processos:', processes);
    console.log('');
    process.exit(0);
  } catch (e) {
    console.error('✗ Falha na conexão:', e.message);
    if (e.message?.includes('connect') || e.message?.includes('ECONNREFUSED')) {
      console.error('');
      console.error('Dicas:');
      console.error('  - Local: suba o PostgreSQL (docker compose up -d)');
      console.error('  - Neon: confira a connection string no console.neon.tech e ?sslmode=require');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

check();
