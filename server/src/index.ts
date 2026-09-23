import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { contentRouter } from './routes/content.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());
app.use(cors({ origin: origins }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api', contentRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`PhysioTree-API lyssnar på :${port}`);
});
