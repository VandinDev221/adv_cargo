#!/usr/bin/env node
/**
 * Simula um ataque de SQL injection para testar a defesa.
 * Deve retornar 403 e registrar em ThreatLog.
 * Uso: node scripts/test-sql-injection.js [baseURL]
 */
const base = process.argv[2] || 'http://localhost:3001';

const payloads = [
  { name: 'Login com OR 1=1', url: `${base}/api/auth/login`, method: 'POST', body: { email: "' OR 1=1 --", password: 'x' } },
  { name: 'Query UNION SELECT', url: `${base}/api/search?q=1' UNION SELECT * FROM users --`, method: 'GET' },
  { name: 'Body com DROP', url: `${base}/api/processes`, method: 'POST', body: { cnjNumber: "1'; DROP TABLE processes; --" } },
];

async function test(p) {
  const opts = { method: p.method, headers: { 'Content-Type': 'application/json' } };
  if (p.body) opts.body = JSON.stringify(p.body);
  const res = await fetch(p.url, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { name: p.name, status: res.status, data };
}

async function main() {
  console.log('=== Teste de defesa contra SQL Injection ===\n');
  console.log('Base URL:', base);
  for (const p of payloads) {
    try {
      const r = await test(p);
      const ok = r.status === 403 && (typeof r.data === 'object' && r.data?.error?.includes('suspeita'));
      console.log(r.name);
      console.log('  Status:', r.status, ok ? '✓ (bloqueado)' : '');
      console.log('  Resposta:', typeof r.data === 'object' ? r.data?.error || r.data : r.data?.slice(0, 80));
      console.log('');
    } catch (e) {
      console.log(p.name, '-> Erro:', e.message, '\n');
    }
  }
  console.log('Se todos retornaram 403 com "Requisição suspeita bloqueada", a defesa está ativa.');
  console.log('Confira em Defesa e ameaças (ou GET /api/security/threats com token dev) os registros em ThreatLog.');
}

main();
