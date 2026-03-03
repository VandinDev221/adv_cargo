import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { upload } from '../lib/upload.js';

export const processRoutes = Router();

processRoutes.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = { officeId: req.user.officeId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { parts: { contains: search, mode: 'insensitive' } },
      ];
    }
    const list = await prisma.process.findMany({
      where,
      include: { client: true, responsible: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

processRoutes.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    const process = await prisma.process.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
    });
    if (!process) return res.status(404).json({ error: 'Processo não encontrado' });
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
    const doc = await prisma.document.create({
      data: {
        processId: process.id,
        name: req.body.name || req.file.originalname,
        path: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

processRoutes.get('/:id', async (req, res) => {
  try {
    const process = await prisma.process.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
      include: {
        client: true,
        responsible: { select: { id: true, name: true, email: true } },
        timeline: { orderBy: { date: 'desc' } },
        documents: true,
      },
    });
    if (!process) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json(process);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

processRoutes.post('/', async (req, res) => {
  try {
    const { number, court, subject, causeValue, status, parts, clientId } = req.body;
    if (!number) return res.status(400).json({ error: 'Número CNJ é obrigatório' });
    const process = await prisma.process.create({
      data: {
        number,
        court: court || null,
        subject: subject || null,
        causeValue: causeValue ? Number(causeValue) : null,
        status: status || 'ativo',
        parts: parts || null,
        clientId: clientId || null,
        responsibleId: req.user.id,
        officeId: req.user.officeId,
      },
      include: { client: true },
    });
    res.status(201).json(process);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

processRoutes.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.process.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
    });
    if (!existing) return res.status(404).json({ error: 'Processo não encontrado' });
    const { number, court, subject, causeValue, status, parts, clientId, responsibleId } = req.body;
    const process = await prisma.process.update({
      where: { id: req.params.id },
      data: {
        ...(number != null && { number }),
        ...(court != null && { court }),
        ...(subject != null && { subject }),
        ...(causeValue != null && { causeValue: Number(causeValue) }),
        ...(status != null && { status }),
        ...(parts != null && { parts }),
        ...(clientId != null && { clientId }),
        ...(responsibleId != null && { responsibleId }),
      },
      include: { client: true, responsible: { select: { id: true, name: true } } },
    });
    res.json(process);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

processRoutes.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.process.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
    });
    if (!existing) return res.status(404).json({ error: 'Processo não encontrado' });
    await prisma.process.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Timeline
processRoutes.post('/:id/timeline', async (req, res) => {
  try {
    const existing = await prisma.process.findFirst({
      where: { id: req.params.id, officeId: req.user.officeId },
    });
    if (!existing) return res.status(404).json({ error: 'Processo não encontrado' });
    const { title, description, type } = req.body;
    const event = await prisma.processEvent.create({
      data: {
        processId: req.params.id,
        title: title || 'Evento',
        description: description || null,
        type: type || 'geral',
      },
    });
    res.status(201).json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

processRoutes.delete('/:id/timeline/:eventId', async (req, res) => {
  try {
    const event = await prisma.processEvent.findFirst({
      where: { id: req.params.eventId, processId: req.params.id },
      include: { process: true },
    });
    if (!event || event.process.officeId !== req.user.officeId) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    await prisma.processEvent.delete({ where: { id: req.params.eventId } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
