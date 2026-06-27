import { useState } from 'react';
import { motion } from 'framer-motion';

const PERSONA_NAMES: Record<string, string> = {
  P01: '卧床空想家', P02: '夜半断线玩家', P03: '拂晓强制开机人',
  P04: '全天续航透支者', P05: '深夜自留夜猫客', P06: '天赋安睡收藏家',
};
const PERSONA_COLORS: Record<string, string> = {
  P01: '#a78bfa', P02: '#60a5fa', P03: '#fbbf24',
  P04: '#f87171', P05: '#34d399', P06: '#818cf8',
};
const LEVEL_COLORS: Record<string, string> = {
  '优秀': '#34d399', '良好': '#60a5fa', '轻度': '#fbbf24',
  '中度': '#fb923c', '重度': '#ef4444', '严重': '#b91c1c',
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

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-mid/70 w-20 shrink-0 text-right">{label}</span>}
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, width: `${pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-medium text-dark w-8 shrink-0">{value}</span>
    </div>
  );
}

function SimpleBarChart({ data, color }: { data: { label: string; value: number }[]; color: string | ((label: string) => string) }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <Bar
          key={d.label}
          label={d.label}
          value={d.value}
          max={max}
          color={typeof color === 'function' ? color(d.label) : color}
        />
      ))}
    </div>
  );
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

  // Sort data for charts
  const sortedPersonas = Object.entries(persona_distribution).sort((a, b) => b[1] - a[1]);
  const sortedDays = Object.entries(daily_counts).sort((a, b) => a[0].localeCompare(b[0]));
  const sortedTags = Object.entries(tag_frequency).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const levelEntries = Object.entries(level_distribution).sort(
    (a, b) => (['优秀', '良好', '轻度', '中度', '重度', '严重'].indexOf(a[0]) - ['优秀', '良好', '轻度', '中度', '重度', '严重'].indexOf(b[0]))
  );

  const maxPersona = Math.max(...sortedPersonas.map(([, v]) => v), 1);
  const maxDaily = Math.max(...sortedDays.map(([, v]) => v), 1);
  const maxTag = Math.max(...sortedTags.map(([, v]) => v), 1);

  return (
    <div className="page-container">
      <div className="text-center pb-3">
        <h1 className="text-xl font-bold text-dark">🌙 眠格数据看板</h1>
        <p className="text-xs text-gray-mid/60">共 {total} 条记录</p>
      </div>

      <div className="page-scroll space-y-4 pb-4">
        {/* Stats cards */}
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

        {/* Personality distribution */}
        <div className="glass-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-dark">🧠 人格分布</h3>
          {sortedPersonas.map(([key, val]) => (
            <Bar
              key={key}
              label={PERSONA_NAMES[key] || key}
              value={val}
              max={maxPersona}
              color={PERSONA_COLORS[key] || '#6366f1'}
            />
          ))}
        </div>

        {/* Level distribution */}
        <div className="glass-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-dark">📊 等级分布</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {levelEntries.map(([lvl, count]) => (
              <div key={lvl} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: LEVEL_COLORS[lvl] || '#ccc', height: `${Math.max(30, (count / Math.max(...levelEntries.map(([, v]) => v), 1)) * 80)}px` }}
                >
                  {count}
                </div>
                <span className="text-[10px] text-gray-mid/60">{lvl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily trend */}
        <div className="glass-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-dark">📈 每日完成量</h3>
          <div className="flex items-end gap-1 h-24">
            {sortedDays.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
                <motion.div
                  className="w-full bg-primary/60 rounded-t-md"
                  style={{ height: `${(count / maxDaily) * 100}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(count / maxDaily) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
                <span className="text-[8px] text-gray-mid/40">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        {sortedTags.length > 0 && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-dark">🏷️ 标签频率 Top 10</h3>
            {sortedTags.map(([tag, count]) => (
              <Bar key={tag} label={tag} value={count} max={maxTag} color="#a78bfa" />
            ))}
          </div>
        )}

        {/* Raw data */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-dark mb-3">📋 原始数据</h3>
          {records.length === 0 ? (
            <p className="text-xs text-gray-mid/60 text-center py-6">暂无数据</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {records.slice().reverse().map((r, i) => (
                <div key={i} className="text-xs bg-gray-50 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-mid/50">{r.date || '-'}</span>
                    <span className="font-semibold" style={{ color: PERSONA_COLORS[r.primary_persona] || '#6366f1' }}>
                      {PERSONA_NAMES[r.primary_persona] || r.primary_persona}
                    </span>
                    {r.secondary_persona && (
                      <span className="text-gray-mid/60">
                        + {PERSONA_NAMES[r.secondary_persona] || r.secondary_persona}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-gray-mid/60 flex-wrap">
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
