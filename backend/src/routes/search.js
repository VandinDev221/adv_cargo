import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const searchRoutes = Router();

searchRoutes.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ processes: [], clients: [], deadlines: [] });
    }
    const term = { contains: q, mode: 'insensitive' };
    const [processes, clients, deadlines] = await Promise.all([
      prisma.process.findMany({
        where: {
          officeId: req.user.officeId,
          OR: [
            { number: term },
            { subject: term },
            { parts: term },
            { court: term },
          ],
        },
        take: 10,
        select: { id: true, number: true, subject: true, status: true },
      }),
      prisma.client.findMany({
        where: {
          officeId: req.user.officeId,
          OR: [
            { name: term },
            { document: term },
            { email: term },
          ],
        },
        take: 10,
        select: { id: true, name: true, document: true },
      }),
      prisma.deadline.findMany({
        where: {
          userId: req.user.id,
          completed: false,
          OR: [{ title: term }, { description: term }],
        },
        take: 5,
        include: { process: { select: { number: true } } },
      }),
    ]);
    res.json({ processes, clients, deadlines });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
