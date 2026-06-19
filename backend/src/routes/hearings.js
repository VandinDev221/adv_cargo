import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const hearingRoutes = Router();

hearingRoutes.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { userId: req.user.id };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const list = await prisma.hearing.findMany({
      where,
      include: { process: { select: { id: true, number: true, subject: true } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

hearingRoutes.post('/', async (req, res) => {
  try {
    const { title, date, time, location, type, processId, calendarSync } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Título e data são obrigatórios' });
    const hearing = await prisma.hearing.create({
      data: {
        title,
        date: new Date(date),
        time: time || null,
        location: location || null,
        type: type || null,
        processId: processId || null,
        userId: req.user.id,
        calendarSync: calendarSync || null,
      },
      include: { process: { select: { id: true, number: true } } },
    });
    res.status(201).json(hearing);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

hearingRoutes.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.hearing.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Audiência não encontrada' });
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const hearing = await prisma.hearing.update({
      where: { id: req.params.id },
      data,
      include: { process: { select: { id: true, number: true } } },
    });
    res.json(hearing);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

hearingRoutes.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.hearing.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Audiência não encontrada' });
    await prisma.hearing.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
