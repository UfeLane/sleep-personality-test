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

app.use(cors());
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

    const record = {
      primary_persona,
      secondary_persona: secondary_persona || null,
      psqi_total,
      level,
      tags: tags || [],
      date: new Date().toISOString().split('T')[0], // date only, no time/IP
    };

    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(COLLECTION_FILE, JSON.stringify(record) + '\n', { flag: 'a' });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: '保存失败' });
  }
});

// Production: serve built frontend
if (isProduction) {
  const distPath = join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
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
  console.log(`  📦 模式: ${isProduction ? '生产' : '开发'}\n`);
});
