import { Router, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate, requireAdmin } from '../auth.js';

export const contentRouter = Router();

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Endast gemener, siffror och bindestreck (a–z, 0–9, -)');

// Översätter vanliga Prisma-fel till HTTP-svar.
function handlePrismaError(e: unknown, res: Response) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Id:t finns redan' });
    if (e.code === 'P2025') return res.status(404).json({ error: 'Hittades inte' });
  }
  console.error(e);
  return res.status(500).json({ error: 'Serverfel' });
}

/** Publikt: hela innehållet för appen. */
contentRouter.get('/content', async (_req, res) => {
  const [regions, tests, diagnoses] = await Promise.all([
    prisma.region.findMany(),
    prisma.test.findMany({ orderBy: { id: 'asc' } }),
    prisma.diagnosis.findMany({ orderBy: { id: 'asc' } }),
  ]);
  res.json({ regions, tests, diagnoses });
});

/* ------------------------- Tester ------------------------- */
const testSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  structure: z.string().default(''),
  sensitivity: z.number().min(0).max(1).nullable().default(null),
  specificity: z.number().min(0).max(1).nullable().default(null),
  lrPositive: z.number().nullable().default(null),
  lrNegative: z.number().nullable().default(null),
  source: z.string().default(''),
  video: z.string().default(''),
  body: z.string().default(''),
});

contentRouter.post('/tests', authenticate, requireAdmin, async (req, res) => {
  const parsed = testSchema.extend({ id: slug }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const test = await prisma.test.create({ data: parsed.data });
    res.status(201).json(test);
  } catch (e) {
    handlePrismaError(e, res);
  }
});

contentRouter.put('/tests/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = testSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const test = await prisma.test.update({
      where: { id: req.params.id as string },
      data: parsed.data,
    });
    res.json(test);
  } catch (e) {
    handlePrismaError(e, res);
  }
});

contentRouter.delete('/tests/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.test.delete({ where: { id: req.params.id as string } });
    res.status(204).end();
  } catch (e) {
    handlePrismaError(e, res);
  }
});

/* ------------------------- Diagnoser ------------------------- */
const diagnosisSchema = z.object({
  name: z.string().min(1),
  umbrella: z.string().nullable().default(null),
  relatedTests: z.array(z.string()).default([]),
  body: z.string().default(''),
});

function diagnosisData(d: z.infer<typeof diagnosisSchema>) {
  return {
    name: d.name,
    umbrella: d.umbrella,
    relatedTests: d.relatedTests as Prisma.InputJsonValue,
    body: d.body,
  };
}

contentRouter.post('/diagnoses', authenticate, requireAdmin, async (req, res) => {
  const parsed = diagnosisSchema.extend({ id: slug }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const diagnosis = await prisma.diagnosis.create({
      data: { id: parsed.data.id, ...diagnosisData(parsed.data) },
    });
    res.status(201).json(diagnosis);
  } catch (e) {
    handlePrismaError(e, res);
  }
});

contentRouter.put('/diagnoses/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = diagnosisSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const diagnosis = await prisma.diagnosis.update({
      where: { id: req.params.id as string },
      data: diagnosisData(parsed.data),
    });
    res.json(diagnosis);
  } catch (e) {
    handlePrismaError(e, res);
  }
});

contentRouter.delete('/diagnoses/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.diagnosis.delete({ where: { id: req.params.id as string } });
    res.status(204).end();
  } catch (e) {
    handlePrismaError(e, res);
  }
});

/* ------------------------- Regioner ------------------------- */
const regionSchema = z.object({
  label: z.string().min(1),
  symptoms: z.array(z.any()).default([]),
});

contentRouter.post('/regions', authenticate, requireAdmin, async (req, res) => {
  const parsed = regionSchema.extend({ region: slug }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const region = await prisma.region.create({
      data: {
        region: parsed.data.region,
        label: parsed.data.label,
        symptoms: parsed.data.symptoms as unknown as Prisma.InputJsonValue,
      },
    });
    res.status(201).json(region);
  } catch (e) {
    handlePrismaError(e, res);
  }
});

contentRouter.put('/regions/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = regionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const region = await prisma.region.update({
      where: { region: req.params.id as string },
      data: {
        label: parsed.data.label,
        symptoms: parsed.data.symptoms as unknown as Prisma.InputJsonValue,
      },
    });
    res.json(region);
  } catch (e) {
    handlePrismaError(e, res);
  }
});

contentRouter.delete('/regions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.region.delete({ where: { region: req.params.id as string } });
    res.status(204).end();
  } catch (e) {
    handlePrismaError(e, res);
  }
});
