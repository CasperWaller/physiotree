import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import yaml from 'js-yaml';
import { PrismaClient } from '@prisma/client';

const here = dirname(fileURLToPath(import.meta.url));
// content/ ligger i repo-roten. Fungerar både för tsx (prisma/) och
// kompilerad kod (dist/prisma/): vi letar uppåt tills vi hittar content/.
function findContentDir(): string {
  const candidates = [
    process.env.CONTENT_DIR, // explicit override (t.ex. i Docker)
    join(here, '..', '..', 'content'), // server/prisma -> repo/content (tsx)
    join(here, '..', '..', '..', 'content'), // server/dist/prisma -> repo/content (kompilerad)
  ].filter((c): c is string => !!c);
  for (const c of candidates) {
    try {
      readdirSync(c);
      return c;
    } catch {
      /* prova nästa */
    }
  }
  return candidates[0];
}

const contentDir = findContentDir();

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

async function seedTests(prisma: PrismaClient, overwrite: boolean) {
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
    // additivt (overwrite=false): rör inte befintliga rader (skyddar admin-ändringar)
    await prisma.test.upsert({
      where: { id },
      create: { id, ...payload },
      update: overwrite ? payload : {},
    });
    n++;
  }
  return n;
}

async function seedDiagnoses(prisma: PrismaClient, overwrite: boolean) {
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
    await prisma.diagnosis.upsert({
      where: { id },
      create: { id, ...payload },
      update: overwrite ? payload : {},
    });
    n++;
  }
  return n;
}

async function seedRegions(prisma: PrismaClient, overwrite: boolean) {
  let n = 0;
  const full = join(contentDir, 'regions');
  for (const f of readdirSync(full).filter((x) => x.endsWith('.yaml'))) {
    const doc = yaml.load(readFileSync(join(full, f), 'utf8')) as {
      region: string;
      label?: string;
      symptoms?: unknown[];
    };
    const payload = { label: doc.label ?? doc.region, symptoms: (doc.symptoms ?? []) as object };
    await prisma.region.upsert({
      where: { region: doc.region },
      create: { region: doc.region, ...payload },
      update: overwrite ? payload : {},
    });
    n++;
  }
  return n;
}

async function seedAdmin(prisma: PrismaClient) {
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
    // ADMIN_PASSWORD är källan: synka lösenord/roll från env vid varje deploy
    update: { passwordHash, role: 'admin' },
  });
  console.log(`✓ Admin-användare: ${email}`);
}

/**
 * Seedar databasen från content/.
 * overwrite=true  → skriv över befintliga rader (manuell dev-seed).
 * overwrite=false → additivt: skapa bara nya id:n, rör aldrig befintliga
 *                   (används vid deploy så nya regioner läggs till utan att
 *                   admin-ändringar skrivs över).
 */
export async function runSeed(overwrite = true): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const t = await seedTests(prisma, overwrite);
    const d = await seedDiagnoses(prisma, overwrite);
    const r = await seedRegions(prisma, overwrite);
    await seedAdmin(prisma);
    console.log(
      `✓ Seedade ${t} tester, ${d} diagnoser, ${r} regioner (${overwrite ? 'overwrite' : 'additivt'}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}
