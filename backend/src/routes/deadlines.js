import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const deadlineRoutes = Router();

deadlineRoutes.get('/', async (req, res) => {
  try {
    const { from, to, completed } = req.query;
    const where = { userId: req.user.id };
    if (completed !== undefined) where.completed = completed === 'true';
    if (from || to) {
      where.dueDate = {};
      if (from) where.dueDate.gte = new Date(from);
      if (to) where.dueDate.lte = new Date(to);
    }
    const list = await prisma.deadline.findMany({
      where,
      include: { process: { select: { id: true, number: true, subject: true } } },
      orderBy: { dueDate: 'asc' },
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

deadlineRoutes.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      type,
      priority,
      processId,
      notify24h,
      notify48h,
      notify7d,
    } = req.body;
    if (!title || !dueDate) return res.status(400).json({ error: 'Título e data são obrigatórios' });
    const deadline = await prisma.deadline.create({
      data: {
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        type: type || 'processual',
        priority: priority || 'rotina',
        processId: processId || null,
        userId: req.user.id,
        notify24h: notify24h !== false,
        notify48h: notify48h !== false,
        notify7d: notify7d !== false,
      },
      include: { process: { select: { id: true, number: true } } },
    });
    res.status(201).json(deadline);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

deadlineRoutes.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.deadline.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Prazo não encontrado' });
    const deadline = await prisma.deadline.update({
      where: { id: req.params.id },
      data: req.body,
      include: { process: { select: { id: true, number: true } } },
    });
    res.json(deadline);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

deadlineRoutes.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.deadline.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Prazo não encontrado' });
    await prisma.deadline.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
