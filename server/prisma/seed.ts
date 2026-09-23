import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import yaml from 'js-yaml';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', '..', 'content');

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw.trim() };
  return {
    data: (yaml.load(m[1]) as Record<string, unknown>) ?? {},
    body: (m[2] ?? '').trim(),
  };
}

function readMd(dir: string) {
  const full = join(contentDir, dir);
  return readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseFrontmatter(readFileSync(join(full, f), 'utf8')));
}

async function seedTests() {
  let n = 0;
  for (const { data, body } of readMd('tests')) {
    const id = String(data.id);
    if (!id || id === 'undefined') continue;
    const payload = {
      name: String(data.name ?? id),
      region: String(data.region ?? ''),
      structure: String(data.structure ?? ''),
      sensitivity: (data.sensitivity as number) ?? null,
      specificity: (data.specificity as number) ?? null,
      lrPositive: (data.lr_positive as number) ?? null,
      lrNegative: (data.lr_negative as number) ?? null,
      source: String(data.source ?? ''),
      video: String(data.video ?? ''),
      body,
    };
    await prisma.test.upsert({ where: { id }, create: { id, ...payload }, update: payload });
    n++;
  }
  return n;
}

async function seedDiagnoses() {
  let n = 0;
  for (const { data, body } of readMd('diagnoses')) {
    const id = String(data.id);
    if (!id || id === 'undefined') continue;
    const payload = {
      name: String(data.name ?? id),
      umbrella: (data.umbrella as string | null) ?? null,
      relatedTests: (data.related_tests as string[]) ?? [],
      body,
    };
    await prisma.diagnosis.upsert({ where: { id }, create: { id, ...payload }, update: payload });
    n++;
  }
  return n;
}

async function seedRegions() {
  let n = 0;
  const full = join(contentDir, 'regions');
  for (const f of readdirSync(full).filter((x) => x.endsWith('.yaml'))) {
    const doc = yaml.load(readFileSync(join(full, f), 'utf8')) as {
      region: string;
      label?: string;
      symptoms?: unknown[];
    };
    const payload = {
      label: doc.label ?? doc.region,
      symptoms: (doc.symptoms ?? []) as object,
    };
    await prisma.region.upsert({
      where: { region: doc.region },
      create: { region: doc.region, ...payload },
      update: payload,
    });
    n++;
  }
  return n;
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('⚠ ADMIN_EMAIL/ADMIN_PASSWORD saknas – hoppar över admin-användare.');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: 'admin' },
    update: { passwordHash, role: 'admin' },
  });
  console.log(`✓ Admin-användare: ${email}`);
}

async function main() {
  const t = await seedTests();
  const d = await seedDiagnoses();
  const r = await seedRegions();
  await seedAdmin();
  console.log(`✓ Seedade ${t} tester, ${d} diagnoser, ${r} regioner.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
