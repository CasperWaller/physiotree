import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const TOKEN_TTL = '12h';

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/** Verifierar JWT och lägger användaren på req.user. */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Ingen token' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
    next();
  } catch {
    return res.status(401).json({ error: 'Ogiltig token' });
  }
}

/** Kräver att den autentiserade användaren är admin. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Kräver admin-behörighet' });
  }
  next();
}
