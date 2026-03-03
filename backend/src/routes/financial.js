import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const financialRoutes = Router();

financialRoutes.get('/', async (req, res) => {
  try {
    const { type, processId, from, to } = req.query;
    const where = { officeId: req.user.officeId };
    if (type) where.type = type;
    if (processId) where.processId = processId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const list = await prisma.financial.findMany({
      where,
      include: { process: { select: { id: true, number: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

financialRoutes.post('/', async (req, res) => {
  try {
    const { type, description, value, date, processId } = req.body;
    if (!type || !description || value == null) {
      return res.status(400).json({ error: 'Tipo, descrição e valor são obrigatórios' });
    }
    const financial = await prisma.financial.create({
      data: {
        type,
        description,
        value: Number(value),
        date: date ? new Date(date) : new Date(),
        processId: processId || null,
        officeId: req.user.officeId,
      },
      include: { process: { select: { id: true, number: true } } },
    });
    res.status(201).json(financial);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

financialRoutes.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.financial.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
    });
    if (!existing) return res.status(404).json({ error: 'Lançamento não encontrado' });
    const data = { ...req.body };
    if (data.value != null) data.value = Number(data.value);
    if (data.date) data.date = new Date(data.date);
    const financial = await prisma.financial.update({
      where: { id: req.params.id },
      data,
      include: { process: { select: { id: true, number: true } } },
    });
    res.json(financial);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

financialRoutes.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.financial.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
    });
    if (!existing) return res.status(404).json({ error: 'Lançamento não encontrado' });
    await prisma.financial.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
