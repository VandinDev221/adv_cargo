import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { addToBlocklist, removeFromBlocklist, getMemoryBlocklist } from '../lib/blocklist.js';

export const securityRoutes = Router();

securityRoutes.get('/blocked', async (req, res) => {
  if (!prisma.blockedIp) return res.status(503).json({ error: 'Execute: npx prisma generate' });
  try {
    const list = await prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' } });
    const memory = getMemoryBlocklist();
    const inDb = list.map((r) => r.ip);
    const onlyMemory = memory.filter((ip) => !inDb.includes(ip));
    res.json({ fromDb: list, onlyInMemory: onlyMemory });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

securityRoutes.post('/block', async (req, res) => {
  if (!prisma.blockedIp) return res.status(503).json({ error: 'Execute: npx prisma generate' });
  try {
    const { ip, reason } = req.body || {};
    const raw = ip != null ? String(ip).trim() : '';
    if (!raw) return res.status(400).json({ error: 'IP é obrigatório' });
    addToBlocklist(raw);
    await prisma.blockedIp.upsert({
      where: { ip: raw },
      update: { reason: reason != null ? String(reason).trim() || null : undefined },
      create: { ip: raw, reason: reason != null ? String(reason).trim() || null : null },
    });
    return res.json({ ok: true, ip: raw });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro ao bloquear' });
  }
});

securityRoutes.delete('/block/:ip', async (req, res) => {
  if (!prisma.blockedIp) return res.status(503).json({ error: 'Execute: npx prisma generate' });
  try {
    const ip = decodeURIComponent(req.params.ip).trim();
    removeFromBlocklist(ip);
    await prisma.blockedIp.deleteMany({ where: { ip } });
    res.json({ ok: true, ip });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

securityRoutes.get('/threats', async (req, res) => {
  if (!prisma.threatLog) return res.status(503).json({ error: 'Execute: npx prisma generate' });
  try {
    const { limit = '100', type } = req.query;
    const take = Math.min(parseInt(limit, 10) || 100, 500);
    const where = type ? { threatType: type } : {};
    const items = await prisma.threatLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });
    const counts = await prisma.threatLog.groupBy({
      by: ['threatType'],
      _count: { id: true },
    });
    res.json({ items, byType: counts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

securityRoutes.get('/report', async (req, res) => {
  if (!prisma.blockedIp || !prisma.threatLog) return res.status(503).json({ error: 'Execute: npx prisma generate' });
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [threats, failedLogins, rateLimitHits, blockedIps] = await Promise.all([
      prisma.threatLog.count({ where: { createdAt: { gte: since } } }),
      prisma.auditLog.count({ where: { action: 'auth.login_failed', createdAt: { gte: since } } }),
      prisma.auditLog.count({ where: { action: 'rate_limit.exceeded', createdAt: { gte: since } } }),
      prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);
    const threatsByIp = await prisma.threatLog.groupBy({
      by: ['ip'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    res.json({
      since: since.toISOString(),
      summary: { threats, failedLogins, rateLimitHits, blockedCount: blockedIps.length },
      blockedIps,
      topThreatIps: threatsByIp.slice(0, 20),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Scan: analisa logs recentes e sugere IPs para bloqueio */
securityRoutes.get('/scan', async (req, res) => {
  if (!prisma.blockedIp || !prisma.threatLog) return res.status(503).json({ error: 'Execute: npx prisma generate' });
  try {
    const hours = Math.min(parseInt(req.query.hours, 10) || 24, 168);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const [failedByIp, rateLimitByIp, threatByIp] = await Promise.all([
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
    ]);
    const blocked = await prisma.blockedIp.findMany({ select: { ip: true } });
    const blockedSet = new Set(blocked.map((b) => b.ip));
    const score = {};
    failedByIp.forEach((r) => { score[r.ip] = (score[r.ip] || 0) + r._count.id * 2; });
    rateLimitByIp.forEach((r) => { score[r.ip] = (score[r.ip] || 0) + r._count.id * 3; });
    threatByIp.forEach((r) => { score[r.ip] = (score[r.ip] || 0) + r._count.id * 10; });
    const suggested = Object.entries(score)
      .filter(([ip]) => !blockedSet.has(ip) && score[ip] >= 5)
      .map(([ip, s]) => ({ ip, score: s }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    res.json({ since: since.toISOString(), hours, suggested });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
