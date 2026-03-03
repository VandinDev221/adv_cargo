import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const reportRoutes = Router();

reportRoutes.get('/processes-by-status', async (req, res) => {
  try {
    const result = await prisma.process.groupBy({
      by: ['status'],
      where: { officeId: req.user.officeId },
      _count: { id: true },
    });
    res.json(result.map((r) => ({ status: r.status, count: r._count.id })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

reportRoutes.get('/cash-flow', async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { officeId: req.user.officeId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const items = await prisma.financial.findMany({ where });
    const receitas = items.filter((i) => i.type === 'receita' || i.type === 'honorario').reduce((s, i) => s + i.value, 0);
    const despesas = items.filter((i) => i.type === 'despesa').reduce((s, i) => s + i.value, 0);
    res.json({
      receitas: Math.round(receitas * 100) / 100,
      despesas: Math.round(despesas * 100) / 100,
      saldo: Math.round((receitas - despesas) * 100) / 100,
      items: items.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

reportRoutes.get('/productivity', async (req, res) => {
  try {
    const { from, to } = req.query;
    const hearingWhere = { userId: req.user.id };
    const deadlineWhere = { userId: req.user.id };
    if (from || to) {
      const dateFilter = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      if (Object.keys(dateFilter).length) {
        hearingWhere.date = dateFilter;
        deadlineWhere.dueDate = { ...dateFilter };
      }
    }
    const [hearingsTotal, hearingsDone, deadlinesTotal, deadlinesDone] = await Promise.all([
      prisma.hearing.count({ where: hearingWhere }),
      prisma.hearing.count({ where: { ...hearingWhere, completed: true } }),
      prisma.deadline.count({ where: deadlineWhere }),
      prisma.deadline.count({ where: { ...deadlineWhere, completed: true } }),
    ]);
    res.json({
      audiênciasTotal: hearingsTotal,
      audiênciasRealizadas: hearingsDone,
      prazosTotal: deadlinesTotal,
      prazosCumpridos: deadlinesDone,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
