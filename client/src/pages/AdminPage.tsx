import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const PERSONA_NAMES: Record<string, string> = {
  P01: '卧床空想家', P02: '夜半断线玩家', P03: '拂晓强制开机人',
  P04: '全天续航透支者', P05: '深夜自留夜猫客', P06: '天赋安睡收藏家',
};
const PERSONA_COLORS: Record<string, string> = {
  P01: '#a78bfa', P02: '#60a5fa', P03: '#fbbf24',
  P04: '#f87171', P05: '#34d399', P06: '#818cf8',
};
const LEVEL_ORDER = ['优秀', '良好', '轻度', '中度', '重度', '严重'];
const LEVEL_COLORS: Record<string, string> = {
  '优秀': '#34d399', '良好': '#60a5fa', '轻度': '#fbbf24', '中度': '#fb923c', '重度': '#ef4444', '严重': '#b91c1c',
};

interface RecordData {
  date: string;
  primary_persona: string;
  secondary_persona?: string | null;
  psqi_total: number;
  level: string;
  tags: string[];
}

interface DashboardData {
  total: number;
  records: RecordData[];
  avg_psqi: number;
  persona_distribution: Record<string, number>;
  level_distribution: Record<string, number>;
  tag_frequency: Record<string, number>;
  daily_counts: Record<string, number>;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!token.trim()) { setError('请输入管理 Token'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/collect/data?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!json.success) { setError(json.error || '加载失败'); return; }
      setData(json.data);
    } catch {
      setError('加载失败，请检查 Token');
    } finally {
      setLoading(false);
    }
  };

  // Login screen
  if (!data) {
    return (
      <div className="page-container items-center justify-center">
        <motion.div
          className="w-full max-w-sm space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark">🔐 数据看板</h1>
            <p className="text-xs text-gray-mid/60 mt-1">输入管理 Token 查看收集的数据</p>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-mid/80 block mb-1.5">管理 Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                placeholder="请输入 Token"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? '加载中...' : '查看数据'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const { total, avg_psqi, records, persona_distribution, level_distribution, tag_frequency, daily_counts } = data;

  // Persona chart
  const sortedPersonas = Object.entries(persona_distribution).sort((a, b) => b[1] - a[1]);
  const personaChartData = {
    labels: sortedPersonas.map(([k]) => PERSONA_NAMES[k] || k),
    datasets: [{
      label: '人数',
      data: sortedPersonas.map(([, v]) => v),
      backgroundColor: sortedPersonas.map(([k]) => PERSONA_COLORS[k] || '#6366f1'),
      borderRadius: 6,
    }],
  };

  // Level chart
  const levelLabels: string[] = [];
  const levelValues: number[] = [];
  for (const lvl of LEVEL_ORDER) {
    if (level_distribution[lvl]) { levelLabels.push(lvl); levelValues.push(level_distribution[lvl]); }
  }
  const levelChartData = {
    labels: levelLabels,
    datasets: [{ data: levelValues, backgroundColor: levelLabels.map((l) => LEVEL_COLORS[l] || '#ccc') }],
  };

  // Daily chart
  const sortedDays = Object.entries(daily_counts).sort((a, b) => a[0].localeCompare(b[0]));
  const dailyChartData = {
    labels: sortedDays.map(([d]) => d.slice(5)),
    datasets: [{
      label: '完成数',
      data: sortedDays.map(([, v]) => v),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
    }],
  };

  // Tags chart
  const sortedTags = Object.entries(tag_frequency).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const tagChartData = {
    labels: sortedTags.map(([t]) => t),
    datasets: [{
      label: '出现次数',
      data: sortedTags.map(([, v]) => v),
      backgroundColor: '#a78bfa',
      borderRadius: 6,
    }],
  };

  return (
    <div className="page-container">
      <div className="text-center pb-3">
        <h1 className="text-xl font-bold text-dark">🌙 眠格数据看板</h1>
        <p className="text-xs text-gray-mid/60">共 {total} 条记录</p>
      </div>

      <div className="page-scroll space-y-4 pb-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { num: total, label: '总记录数' },
            { num: avg_psqi, label: '平均 PSQI' },
            { num: Object.keys(persona_distribution).length, label: '人格类型' },
            { num: records.filter((r) => r.secondary_persona).length, label: '含辅人格' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-primary">{s.num}</div>
              <div className="text-[11px] text-gray-mid/60 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Persona chart */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">🧠 人格分布</h3>
          <Bar data={personaChartData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          }} />
        </div>

        {/* Level chart */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">📊 等级分布</h3>
          <div className="max-h-52 flex justify-center">
            <Doughnut data={levelChartData} options={{
              responsive: true,
              plugins: { legend: { position: 'right' } },
            }} />
          </div>
        </div>

        {/* Daily chart */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">📈 每日完成量</h3>
          <Line data={dailyChartData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          }} />
        </div>

        {/* Tags chart */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">🏷️ 标签频率 Top 10</h3>
          <Bar data={tagChartData} options={{
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
          }} />
        </div>

        {/* Raw data */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">📋 原始数据</h3>
          {records.length === 0 ? (
            <p className="text-xs text-gray-mid/60 text-center py-6">暂无数据</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {records.slice().reverse().map((r, i) => (
                <div key={i} className="text-xs bg-gray-50 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-mid/50">{r.date || '-'}</span>
                    <span className="font-semibold" style={{ color: PERSONA_COLORS[r.primary_persona] || '#6366f1' }}>
                      {PERSONA_NAMES[r.primary_persona] || r.primary_persona}
                    </span>
                    {r.secondary_persona && <span className="text-gray-mid/60">+ {PERSONA_NAMES[r.secondary_persona] || r.secondary_persona}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-gray-mid/60">
                    <span>PSQI: {r.psqi_total}</span>
                    <span>{r.level}</span>
                    {Array.isArray(r.tags) && r.tags.length > 0 && (
                      <span className="text-primary">{r.tags.join(' · ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
