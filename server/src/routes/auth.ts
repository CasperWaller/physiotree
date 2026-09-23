import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate, signToken } from '../auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ogiltig indata' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Fel e-post eller lösenord' });
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  res.json({ token, user: { email: user.email, role: user.role } });
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: { email: req.user!.email, role: req.user!.role } });
});
