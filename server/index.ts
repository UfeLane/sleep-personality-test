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
      res.json({ success: true, data: [], total: 0 });
      return;
    }

    const raw = readFileSync(COLLECTION_FILE, 'utf-8').trim();
    const records = raw ? raw.split('\n').map((line) => JSON.parse(line)) : [];

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

  // Admin dashboard page (server-rendered, no React dependencies)
  app.get('/admin', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>眠格数据看板</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f5f7;color:#1d1d1f;min-height:100dvh;display:flex;flex-direction:column;align-items:center;padding:24px}
.wrap{width:100%;max-width:560px}
h1{font-size:24px;font-weight:700;margin-bottom:4px;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.sub{color:#86868b;font-size:14px;margin-bottom:20px}
.card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:16px}
.card-title{font-size:15px;font-weight:600;color:#333;margin-bottom:14px}
.login-box{max-width:400px;margin:80px auto 0;text-align:center}
.login-box h2{font-size:20px;margin-bottom:20px}
.inp{width:100%;padding:11px 14px;border:1.5px solid #e5e5ea;border-radius:10px;font-size:14px;outline:0;display:block;margin-bottom:14px}
.inp:focus{border-color:#6366f1}
.btn{width:100%;padding:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer}
.btn:disabled{opacity:.5;cursor:not-allowed}
.err{color:#ef4444;font-size:13px;margin-top:8px}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.stat{text-align:center}
.stat-num{font-size:28px;font-weight:700;color:#6366f1}
.stat-label{font-size:12px;color:#86868b;margin-top:2px}
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.bar-label{font-size:12px;color:#666;width:76px;text-align:right;flex-shrink:0}
.bar-track{flex:1;height:20px;background:#f0f0f2;border-radius:10px;overflow:hidden}
.bar-fill{height:100%;border-radius:10px;transition:width .5s ease}
.bar-val{font-size:12px;color:#333;font-weight:600;width:28px;flex-shrink:0}
.daily-chart{display:flex;align-items:flex-end;gap:2px;height:100px;padding-top:8px}
.daily-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px}
.daily-fill{width:100%;background:#6366f1;border-radius:4px 4px 0 0;min-height:2px;transition:height .5s ease}
.daily-label{font-size:8px;color:#aaa}
.levels{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.level-item{display:flex;flex-direction:column;align-items:center;gap:4px}
.level-bar{width:40px;border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:6px;color:#fff;font-size:13px;font-weight:700}
.level-name{font-size:11px;color:#86868b}
.data-list{max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.data-item{font-size:12px;background:#f9f9fb;border-radius:12px;padding:12px}
.data-item .line1{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.data-item .line2{display:flex;gap:12px;color:#86868b;margin-top:4px;flex-wrap:wrap}
.data-item .tag{color:#6366f1}
.persona-tag{display:inline-block;padding:1px 8px;border-radius:6px;font-size:12px;font-weight:500}
.hidden{display:none}
a{color:#6366f1;text-decoration:none;font-size:13px}
.header-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.btn-sm{padding:6px 14px;background:#fff;border:1.5px solid #e5e5ea;border-radius:8px;font-size:12px;cursor:pointer;color:#555}
.btn-sm:hover{background:#f5f5f7}
</style>
</head>
<body>
<div class="wrap" id="login">
  <div class="login-box">
    <h2>🔐 眠格数据看板</h2>
    <input class="inp" id="tokenInput" type="password" placeholder="管理 Token" value="admin123" onkeydown="if(event.key==='Enter')loadData()">
    <button class="btn" id="loadBtn" onclick="loadData()">查看数据</button>
    <p class="err hidden" id="errEl"></p>
  </div>
</div>

<div class="wrap hidden" id="dash">
  <div class="header-bar">
    <div>
      <h1>🌙 眠格看板</h1>
      <p class="sub" id="summary"></p>
    </div>
    <button class="btn-sm" onclick="showLogin()">断开</button>
  </div>
  <div class="stats" id="stats"></div>
  <div class="card" id="personaCard"><div class="card-title">🧠 人格分布</div><div id="personaChart"></div></div>
  <div class="card" id="levelCard"><div class="card-title">📊 等级分布</div><div class="levels" id="levelChart"></div></div>
  <div class="card" id="dailyCard"><div class="card-title">📈 每日完成量</div><div class="daily-chart" id="dailyChart"></div></div>
  <div class="card" id="tagCard"><div class="card-title">🏷️ 标签频率</div><div id="tagChart"></div></div>
  <div class="card"><div class="card-title">📋 原始数据</div><div class="data-list" id="dataList"></div></div>
</div>

<script>
const NAMES={P01:'卧床空想家',P02:'夜半断线玩家',P03:'拂晓强制开机人',P04:'全天续航透支者',P05:'深夜自留夜猫客',P06:'天赋安睡收藏家'}
const COLORS={P01:'#a78bfa',P02:'#60a5fa',P03:'#fbbf24',P04:'#f87171',P05:'#34d399',P06:'#818cf8'}
const LVL_CLR={'优秀':'#34d399','良好':'#60a5fa','轻度':'#fbbf24','中度':'#fb923c','重度':'#ef4444','严重':'#b91c1c'}
const LVL_ORDER=['优秀','良好','轻度','中度','重度','严重']

function showLogin(){document.getElementById('login').classList.remove('hidden');document.getElementById('dash').classList.add('hidden')}

async function loadData(){
  const token=document.getElementById('tokenInput').value.trim()
  const errEl=document.getElementById('errEl')
  const btn=document.getElementById('loadBtn')
  if(!token){errEl.textContent='请输入 Token';errEl.classList.remove('hidden');return}
  errEl.classList.add('hidden');btn.disabled=true;btn.textContent='加载中...'
  try{
    const r=await fetch('/api/collect/data?token='+encodeURIComponent(token))
    const j=await r.json()
    if(!j.success){errEl.textContent=j.error||'加载失败';errEl.classList.remove('hidden');return}
    render(j.data)
    document.getElementById('login').classList.add('hidden')
    document.getElementById('dash').classList.remove('hidden')
  }catch(e){errEl.textContent='连接失败';errEl.classList.remove('hidden')}
  btn.disabled=false;btn.textContent='查看数据'
}

function render(d){
  const{total,avg_psqi,records,persona_distribution:pDist,level_distribution:lDist,tag_frequency:tFreq,daily_counts:dCount}=d
  document.getElementById('summary').textContent='共 '+total+' 条记录 · 平均 PSQI '+avg_psqi
  document.getElementById('stats').innerHTML=[
    {n:total,l:'总记录数'},{n:avg_psqi,l:'平均 PSQI'},{n:Object.keys(pDist).length,l:'人格类型'},{n:records.filter(r=>r.secondary_persona).length,l:'含辅人格'}
  ].map(s=>'<div class="stat"><div class="stat-num">'+s.n+'</div><div class="stat-label">'+s.l+'</div></div>').join('')

  // Persona bars
  const sp=Object.entries(pDist).sort((a,b)=>b[1]-a[1])
  const pm=Math.max(...sp.map(s=>s[1]),1)
  document.getElementById('personaChart').innerHTML=sp.map(([k,v])=>
    '<div class="bar-row"><span class="bar-label">'+(NAMES[k]||k)+'</span><div class="bar-track"><div class="bar-fill" style="width:'+(v/pm*100)+'%;background:'+(COLORS[k]||'#6366f1')+'"></div></div><span class="bar-val">'+v+'</span></div>'
  ).join('')

  // Level chart
  const lvls=LVL_ORDER.filter(l=>lDist[l]).map(l=>[l,lDist[l]])
  const lm=Math.max(...lvls.map(l=>l[1]),1)
  document.getElementById('levelChart').innerHTML=lvls.map(([l,v])=>
    '<div class="level-item"><div class="level-bar" style="height:'+Math.max(30,v/lm*80)+'px;background:'+(LVL_CLR[l]||'#ccc')+'">'+v+'</div><span class="level-name">'+l+'</span></div>'
  ).join('')

  // Daily chart
  const sd=Object.entries(dCount).sort((a,b)=>a[0].localeCompare(b[0]))
  const dm=Math.max(...sd.map(s=>s[1]),1)
  document.getElementById('dailyChart').innerHTML=sd.map(([d,v])=>
    '<div class="daily-bar"><div class="daily-fill" style="height:'+(v/dm*100)+'%"></div><span class="daily-label">'+d.slice(5)+'</span></div>'
  ).join('')

  // Tags
  const st=Object.entries(tFreq).sort((a,b)=>b[1]-a[1]).slice(0,10)
  const tm=Math.max(...st.map(s=>s[1]),1)
  document.getElementById('tagCard').style.display=st.length?'':'none'
  document.getElementById('tagChart').innerHTML=st.map(([t,v])=>
    '<div class="bar-row"><span class="bar-label">'+t+'</span><div class="bar-track"><div class="bar-fill" style="width:'+(v/tm*100)+'%;background:#a78bfa"></div></div><span class="bar-val">'+v+'</span></div>'
  ).join('')

  // Data list
  if(!records.length){document.getElementById('dataList').innerHTML='<div style="text-align:center;padding:24px;color:#86868b">暂无数据</div>';return}
  document.getElementById('dataList').innerHTML=records.slice().reverse().map(r=>{
    const tags=Array.isArray(r.tags)?r.tags.map(t=>'<span class="tag">'+t+'</span>').join(' '):''
    const sec=r.secondary_persona?' + '+(NAMES[r.secondary_persona]||r.secondary_persona):''
    const c=COLORS[r.primary_persona]||'#6366f1'
    return '<div class="data-item"><div class="line1"><span style="color:#aaa;font-size:11px">'+(r.date||'-')+'</span><span class="persona-tag" style="background:'+c+'22;color:'+c+'">'+(NAMES[r.primary_persona]||r.primary_persona)+'</span>'+sec+'</div><div class="line2"><span>PSQI: '+r.psqi_total+'</span><span>'+(r.level||'')+'</span>'+(tags?'<span>'+tags+'</span>':'')+'</div></div>'
  }).join(''))
}
<\/script>
</body>
</html>`);
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
