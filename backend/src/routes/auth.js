import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { logAction } from '../lib/logger.js';

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
  try {
    const { email, password, name, officeName } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    const office = await prisma.office.create({
      data: {
        name: officeName || name,
        plan: 'individual',
        maxUsers: 1,
      },
    });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        officeId: office.id,
      },
      include: { office: true },
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    const { password: _, ...userSafe } = user;

    await logAction({
      user: { id: user.id, officeId: user.officeId },
      action: 'auth.register',
      req,
      payload: { email: user.email, name: user.name },
    });

    res.json({ user: userSafe, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { office: true },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await logAction({
        user: null,
        action: 'auth.login_failed',
        req,
        payload: { email },
      });
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    const { password: _, ...userSafe } = user;

    await logAction({
      user: { id: user.id, officeId: user.officeId },
      action: 'auth.login',
      req,
      payload: { email: user.email },
    });

    res.json({ user: userSafe, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRoutes.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não informado' });
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'secret');
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { office: true },
    });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    const { password: _, ...userSafe } = user;
    res.json(userSafe);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});
