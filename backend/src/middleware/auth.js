import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não informado' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { office: true },
    });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function devOnlyMiddleware(req, res, next) {
  if (req.user?.role !== 'dev') {
    return res.status(403).json({ error: 'Apenas usuário desenvolvedor pode acessar' });
  }
  next();
}
