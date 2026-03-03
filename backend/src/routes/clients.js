import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const clientRoutes = Router();

clientRoutes.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const where = { officeId: req.user.officeId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const list = await prisma.client.findMany({
      where,
      include: { _count: { select: { processes: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

clientRoutes.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
      include: {
        processes: { select: { id: true, number: true, status: true, subject: true } },
        documents: true,
      },
    });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

clientRoutes.post('/', async (req, res) => {
  try {
    const { name, document, type, email, phone, address } = req.body;
    if (!name || !document) return res.status(400).json({ error: 'Nome e CPF/CNPJ são obrigatórios' });
    const client = await prisma.client.create({
      data: {
        name,
        document,
        type: type || 'pf',
        email: email || null,
        phone: phone || null,
        address: address || null,
        officeId: req.user.officeId,
      },
    });
    res.status(201).json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

clientRoutes.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
    });
    if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

clientRoutes.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
    });
    if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });
    await prisma.client.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
