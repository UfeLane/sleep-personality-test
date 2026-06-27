import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import apiRouter from './routes/api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Allow cross-origin requests (including file:// protocol for local dashboard)
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Anonymous result collection (opt-in, no personal data)
const COLLECTION_FILE = join(__dirname, '..', 'data', 'collection.ndjson');
const DATA_DIR = join(__dirname, '..', 'data');

app.post('/api/collect', (req, res) => {
  try {
    const { primary_persona, secondary_persona, psqi_total, level, tags } = req.body;
    if (!primary_persona || typeof psqi_total !== 'number') {
      res.status(400).json({ success: false, error: '数据格式有误' });
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const record = {
      primary_persona,
      secondary_persona: secondary_persona || null,
      psqi_total,
      level,
      tags: tags || [],
      date,
    };

    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

    // Dedup: check if an identical record already exists today
    if (existsSync(COLLECTION_FILE)) {
      const raw = readFileSync(COLLECTION_FILE, 'utf-8').trim();
      if (raw) {
        const lines = raw.split('\n');
        const fingerprint = JSON.stringify(record);
        const isDuplicate = lines.some((line) => {
          try { return JSON.stringify(JSON.parse(line)) === fingerprint; } catch { return false; }
        });
        if (isDuplicate) {
          res.json({ success: true, deduped: true });
          return;
        }
      }
    }

    writeFileSync(COLLECTION_FILE, JSON.stringify(record) + '\n', { flag: 'a' });
    res.json({ success: true, deduped: false });
  } catch {
    res.status(500).json({ success: false, error: '保存失败' });
  }
});

// Admin: query collected data (protected by token)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';

app.get('/api/collect/data', (req, res) => {
  const token = req.query.token as string;
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ success: false, error: 'token 无效' });
    return;
  }

  try {
    if (!existsSync(COLLECTION_FILE)) {
      res.json({ success: true, data: { total: 0, records: [], avg_psqi: 0, persona_distribution: {}, level_distribution: {}, tag_frequency: {}, daily_counts: {} } });
      return;
    }

    const raw = readFileSync(COLLECTION_FILE, 'utf-8').trim();
    const allRecords = raw ? raw.split('\n').map((line) => JSON.parse(line)) : [];

    // Dedup: keep only unique records by JSON fingerprint
    const seen = new Set<string>();
    const records: typeof allRecords = [];
    for (const r of allRecords) {
      const fp = JSON.stringify(r);
      if (!seen.has(fp)) { seen.add(fp); records.push(r); }
    }

    // Basic stats
    const total = records.length;
    const personaMap: Record<string, number> = {};
    const levelMap: Record<string, number> = {};
    const psqiValues: number[] = [];
    const tagCount: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    for (const r of records) {
      personaMap[r.primary_persona] = (personaMap[r.primary_persona] || 0) + 1;

      if (r.secondary_persona) {
        personaMap[r.secondary_persona] = (personaMap[r.secondary_persona] || 0) + 1;
      }

      levelMap[r.level] = (levelMap[r.level] || 0) + 1;
      psqiValues.push(r.psqi_total);

      if (Array.isArray(r.tags)) {
        for (const tag of r.tags) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        }
      }

      dailyMap[r.date] = (dailyMap[r.date] || 0) + 1;
    }

    const avgPsqi = total > 0 ? (psqiValues.reduce((a, b) => a + b, 0) / total).toFixed(1) : '0';

    res.json({
      success: true,
      data: {
        total,
        records,
        avg_psqi: Number(avgPsqi),
        persona_distribution: personaMap,
        level_distribution: levelMap,
        tag_frequency: tagCount,
        daily_counts: dailyMap,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: '读取数据失败' });
  }
});

// Production: serve built frontend
if (isProduction) {
  const distPath = join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));

  // Admin dashboard — Chart.js data view from file
  const ADMIN_HTML_PATH = join(__dirname, 'admin-dashboard.html');
  app.get('/admin', (_req, res) => {
    try {
      res.type('html').send(readFileSync(ADMIN_HTML_PATH, 'utf-8'));
    } catch {
      res.status(500).send('Dashboard file not found');
    }
  });

  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n  🌙 眠格自测 API Server 已启动`);
  console.log(`  📡 地址: http://localhost:${PORT}`);
  console.log(`  🩺 健康检查: http://localhost:${PORT}/health`);
  console.log(`  📋 接口列表:`);
  console.log(`     GET  /api/questions`);
  console.log(`     GET  /api/personalities`);
  console.log(`     POST /api/submit`);
  console.log(`     GET  /api/result/:assessmentId`);
  console.log(`     POST /api/collect (匿名结果收集)`);
  console.log(`     GET  /api/collect/data (数据看板接口)`);
  console.log(`  📦 模式: ${isProduction ? '生产' : '开发'}\n`);
});
