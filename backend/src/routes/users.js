import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

export const usersRoutes = Router();

usersRoutes.get('/', async (req, res) => {
  try {
    const list = await prisma.user.findMany({
      include: { office: { select: { id: true, name: true, plan: true } } },
      orderBy: { name: 'asc' },
    });
    const safe = list.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json(safe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

usersRoutes.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { office: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const { password, ...rest } = user;
    res.json(rest);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

usersRoutes.post('/', async (req, res) => {
  try {
    const { email, password, name, role, officeId } = req.body;
    if (!email || !password || !name || !officeId) {
      return res.status(400).json({ error: 'Email, senha, nome e escritório são obrigatórios' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });
    const office = await prisma.office.findUnique({ where: { id: officeId } });
    if (!office) return res.status(400).json({ error: 'Escritório não encontrado' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        role: role || 'advogado',
        officeId,
      },
      include: { office: { select: { id: true, name: true } } },
    });
    const { password: _, ...userSafe } = user;
    res.status(201).json(userSafe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

usersRoutes.patch('/:id', async (req, res) => {
  try {
    const { name, email, role, officeId, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (email && email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup) return res.status(400).json({ error: 'Email já em uso por outro usuário' });
    }
    if (officeId) {
      const office = await prisma.office.findUnique({ where: { id: officeId } });
      if (!office) return res.status(400).json({ error: 'Escritório não encontrado' });
    }
    const data = {};
    if (name != null) data.name = name;
    if (email != null) data.email = email;
    if (role != null) data.role = role;
    if (officeId != null) data.officeId = officeId;
    if (password && password.trim()) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { office: { select: { id: true, name: true } } },
    });
    const { password: _, ...userSafe } = user;
    res.json(userSafe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

usersRoutes.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
