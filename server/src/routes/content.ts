import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate, requireAdmin } from '../auth.js';

export const contentRouter = Router();

/** Publikt: hela innehållet för appen. */
contentRouter.get('/content', async (_req, res) => {
  const [regions, tests, diagnoses] = await Promise.all([
    prisma.region.findMany(),
    prisma.test.findMany({ orderBy: { id: 'asc' } }),
    prisma.diagnosis.findMany({ orderBy: { id: 'asc' } }),
  ]);
  res.json({ regions, tests, diagnoses });
});

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

contentRouter.put('/tests/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = testSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const test = await prisma.test.update({
    where: { id: req.params.id as string },
    data: parsed.data,
  });
  res.json(test);
});

const diagnosisSchema = z.object({
  name: z.string().min(1),
  umbrella: z.string().nullable().default(null),
  relatedTests: z.array(z.string()).default([]),
  body: z.string().default(''),
});

contentRouter.put('/diagnoses/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = diagnosisSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const diagnosis = await prisma.diagnosis.update({
    where: { id: req.params.id as string },
    data: {
      name: parsed.data.name,
      umbrella: parsed.data.umbrella,
      relatedTests: parsed.data.relatedTests as Prisma.InputJsonValue,
      body: parsed.data.body,
    },
  });
  res.json(diagnosis);
});

const regionSchema = z.object({
  label: z.string().min(1),
  symptoms: z.array(z.any()),
});

contentRouter.put('/regions/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = regionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const region = await prisma.region.update({
    where: { region: req.params.id as string },
    data: {
      label: parsed.data.label,
      symptoms: parsed.data.symptoms as unknown as Prisma.InputJsonValue,
    },
  });
  res.json(region);
});
