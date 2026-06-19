import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const officesRoutes = Router();

officesRoutes.get('/', async (req, res) => {
  try {
    const list = await prisma.office.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
