import { prisma } from './prisma.js';

export async function logAction({ user, action, req, payload }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        officeId: user?.officeId ?? null,
        action,
        ip: req?.ip ?? null,
        userAgent: req?.headers['user-agent'] ?? null,
        path: req?.path ?? null,
        method: req?.method ?? null,
        payload: payload ? JSON.stringify(payload).slice(0, 4000) : null,
      },
    });
  } catch (e) {
    // nunca quebrar o fluxo da aplicação por causa do log
    console.error('Erro ao gravar log', e);
  }
}

