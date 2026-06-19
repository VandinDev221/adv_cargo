import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { logAction } from '../lib/logger.js';
import { sendVerificationEmail } from '../lib/email.js';
import {
  CODE_EXPIRY_MS,
  MAX_VERIFY_ATTEMPTS,
  RESEND_COOLDOWN_MS,
  generateVerificationCode,
  hashVerificationCode,
  normalizeEmail,
  verifyCode,
} from '../lib/verification.js';

export const authRoutes = Router();

async function createUserAccount({ email, passwordHash, name, officeName }) {
  const office = await prisma.office.create({
    data: {
      name: officeName || name,
      plan: 'individual',
      maxUsers: 1,
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      officeId: office.id,
    },
    include: { office: true },
  });

  return user;
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
}

authRoutes.post('/register/send-code', async (req, res) => {
  try {
    const { email, password, name, officeName } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    const pending = await prisma.pendingRegistration.findUnique({ where: { email: normalizedEmail } });
    if (pending && Date.now() - pending.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - pending.createdAt.getTime())) / 1000);
      return res.status(429).json({ error: `Aguarde ${waitSec}s para reenviar o código` });
    }

    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

    await prisma.pendingRegistration.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        codeHash,
        name: name.trim(),
        passwordHash,
        officeName: officeName?.trim() || null,
        expiresAt,
      },
      update: {
        codeHash,
        name: name.trim(),
        passwordHash,
        officeName: officeName?.trim() || null,
        attempts: 0,
        expiresAt,
        createdAt: new Date(),
      },
    });

    await sendVerificationEmail({ to: normalizedEmail, name: name.trim(), code });

    res.json({
      message: 'Código enviado para o e-mail informado',
      email: normalizedEmail,
      expiresIn: CODE_EXPIRY_MS / 1000,
    });
  } catch (e) {
    console.error('[auth] send-code:', e?.message || e);
    res.status(500).json({ error: e.message || 'Erro ao enviar código' });
  }
});

authRoutes.post('/register/resend-code', async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email || '');
    if (!normalizedEmail) return res.status(400).json({ error: 'Email é obrigatório' });

    const pending = await prisma.pendingRegistration.findUnique({ where: { email: normalizedEmail } });
    if (!pending) return res.status(404).json({ error: 'Cadastro não encontrado. Preencha o formulário novamente.' });

    if (Date.now() - pending.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - pending.createdAt.getTime())) / 1000);
      return res.status(429).json({ error: `Aguarde ${waitSec}s para reenviar o código` });
    }

    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

    await prisma.pendingRegistration.update({
      where: { email: normalizedEmail },
      data: { codeHash, attempts: 0, expiresAt, createdAt: new Date() },
    });

    await sendVerificationEmail({ to: normalizedEmail, name: pending.name, code });

    res.json({
      message: 'Novo código enviado',
      email: normalizedEmail,
      expiresIn: CODE_EXPIRY_MS / 1000,
    });
  } catch (e) {
    console.error('[auth] resend-code:', e?.message || e);
    res.status(500).json({ error: e.message || 'Erro ao reenviar código' });
  }
});

authRoutes.post('/register/verify', async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email || '');
    const code = String(req.body.code || '').trim();

    if (!normalizedEmail || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }

    const pending = await prisma.pendingRegistration.findUnique({ where: { email: normalizedEmail } });
    if (!pending) {
      return res.status(404).json({ error: 'Cadastro não encontrado. Preencha o formulário novamente.' });
    }

    if (pending.expiresAt < new Date()) {
      await prisma.pendingRegistration.delete({ where: { email: normalizedEmail } });
      return res.status(400).json({ error: 'Código expirado. Solicite um novo código.' });
    }

    if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
      await prisma.pendingRegistration.delete({ where: { email: normalizedEmail } });
      return res.status(400).json({ error: 'Muitas tentativas. Solicite um novo código.' });
    }

    const valid = await verifyCode(code, pending.codeHash);
    if (!valid) {
      await prisma.pendingRegistration.update({
        where: { email: normalizedEmail },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_VERIFY_ATTEMPTS - pending.attempts - 1;
      return res.status(400).json({
        error: remaining > 0
          ? `Código inválido. ${remaining} tentativa(s) restante(s).`
          : 'Código inválido. Solicite um novo código.',
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      await prisma.pendingRegistration.delete({ where: { email: normalizedEmail } });
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const user = await createUserAccount({
      email: normalizedEmail,
      passwordHash: pending.passwordHash,
      name: pending.name,
      officeName: pending.officeName,
    });

    await prisma.pendingRegistration.delete({ where: { email: normalizedEmail } });

    const token = signToken(user.id);
    const { password: _, ...userSafe } = user;

    await logAction({
      user: { id: user.id, officeId: user.officeId },
      action: 'auth.register',
      req,
      payload: { email: user.email, name: user.name },
    });

    res.json({ user: userSafe, token });
  } catch (e) {
    console.error('[auth] verify:', e?.message || e);
    res.status(500).json({ error: e.message || 'Erro ao verificar código' });
  }
});

authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { office: true },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await logAction({
        user: null,
        action: 'auth.login_failed',
        req,
        payload: { email: normalizedEmail },
      });
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    const token = signToken(user.id);
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
