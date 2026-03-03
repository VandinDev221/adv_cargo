import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getRateLimitStats } from '../lib/rateLimit.js';
import { getRecentRequests } from '../lib/requestBuffer.js';

export const logsRoutes = Router();

logsRoutes.get('/live', async (req, res) => {
  try {
    const stats = getRateLimitStats();
    const recentRequests = getRecentRequests(80);
    const alerts = await prisma.auditLog.findMany({
      where: {
        action: { in: ['auth.login_failed', 'rate_limit.exceeded'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
    res.json({
      timestamp: new Date().toISOString(),
      rateLimit: {
        byIp: stats.byIp,
        blockedIps: stats.blockedIps,
        windowMs: stats.windowMs,
        maxPerIp: stats.maxPerIp,
      },
      recentRequests,
      alerts,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

logsRoutes.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      perPage = '50',
      action,
      userId,
      ip,
      method,
      path,
      search,
      from,
      to,
      userEmail,
      userName,
    } = req.query;

    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1);
    const take = Math.min(Math.max(parseInt(perPage || '50', 10) || 50, 1), 10000);
    const skip = (pageNum - 1) * take;

    const where = {};

    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (ip) where.ip = { contains: ip, mode: 'insensitive' };
    if (method) where.method = method;
    if (path) where.path = { contains: path, mode: 'insensitive' };
    if (search) where.payload = { contains: search, mode: 'insensitive' };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
    if (userEmail || userName) {
      where.user = {};
      if (userEmail) where.user.email = { contains: userEmail, mode: 'insensitive' };
      if (userName) where.user.name = { contains: userName, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      perPage: take,
      pageCount: Math.ceil(total / take),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Lista todas as requisições HTTP persistidas (nenhuma é excluída) */
logsRoutes.get('/requests', async (req, res) => {
  try {
    const { page = '1', perPage = '100' } = req.query;
    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1);
    const take = Math.min(Math.max(parseInt(perPage || '100', 10) || 100, 1), 10000);
    const skip = (pageNum - 1) * take;
    const [items, total] = await Promise.all([
      prisma.requestLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.requestLog.count(),
    ]);
    res.json({
      items,
      total,
      page: pageNum,
      perPage: take,
      pageCount: Math.ceil(total / take),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Lista ações distintas para preencher o filtro */
logsRoutes.get('/actions', async (req, res) => {
  try {
    const result = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });
    res.json(result.map((r) => r.action));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

