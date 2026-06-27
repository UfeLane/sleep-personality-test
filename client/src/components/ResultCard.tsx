import { motion } from 'framer-motion';
import type { AssessmentResult, PsqiScores } from '../../../shared/types';

interface ResultCardProps {
  result: AssessmentResult;
  scores: PsqiScores;
}

const dims: Array<{
  key: keyof PsqiScores;
  label: string;
  good: string;
  bad: string;
}> = [
  { key: 'quality_score', label: '主观睡眠质量', good: '很好', bad: '很差' },
  { key: 'latency_score', label: '入睡时间', good: '很快', bad: '很困难' },
  { key: 'duration_score', label: '睡眠时长', good: '充足', bad: '偏短' },
  { key: 'efficiency_score', label: '睡眠效率', good: '高效', bad: '偏低' },
  { key: 'disturbance_score', label: '睡眠障碍', good: '无', bad: '严重' },
  { key: 'medication_score', label: '用药情况', good: '未使用', bad: '频繁' },
  { key: 'daytime_score', label: '日间功能', good: '正常', bad: '严重' },
];

function dimColor(value: number): string {
  if (value === 0) return 'bg-green-400';
  if (value === 1) return 'bg-yellow-400';
  if (value === 2) return 'bg-orange-400';
  return 'bg-red-500';
}

export default function ResultCard({ result, scores }: ResultCardProps) {
  const psqi = scores.psqi_lite_total;
  const positionPct = Math.round((psqi / 21) * 100);
  const thresholdPct = Math.round((8 / 21) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6 space-y-5"
    >
      {/* PSQI Total Score */}
      <div className="text-center">
        <p className="text-sm font-semibold text-dark mb-1">PSQI-Lite 总分</p>
        <p className="text-xs text-gray-mid/60 mb-4">
          （分数越高表示睡眠质量越差）
        </p>
        <div className="text-4xl font-bold text-dark mb-4">
          {psqi}
          <span className="text-lg font-normal text-gray-mid/50"> /21</span>
        </div>
        <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(to right, #34d399, #facc15, #ef4444)',
            }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-strong border-2 border-white"
            style={{ left: `calc(${positionPct}% - 10px)` }}
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <div className="absolute inset-0.5 rounded-full bg-dark/10" />
          </motion.div>
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/60"
            style={{ left: `calc(${thresholdPct}%)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-mid/50">
          <span>良好</span>
          <span className="text-gray-mid/70 font-medium">阈值 8分</span>
          <span>较差</span>
        </div>
      </div>

      {/* Level indicator */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] text-gray-mid/60">0-5 良好</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-[10px] text-gray-mid/60">6-10 轻度</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[10px] text-gray-mid/60">11-15 中度</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-gray-mid/60">≥16 严重</span>
        </div>
      </div>

      {/* 7 Dimensions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-mid/70">
          七维评分详情（分数越高越差）
        </p>
        {dims.map((dim) => {
          const value = scores[dim.key] as number;
          const pct = (value / 3) * 100;
          return (
            <div key={dim.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-mid/80">{dim.label}</span>
                <span className="text-dark font-medium">{value}/3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-mid/40 w-7 shrink-0 text-right">
                  {dim.good}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: value === 0
                        ? '#34d399'
                        : value === 1
                        ? '#facc15'
                        : value === 2
                        ? '#fb923c'
                        : '#ef4444',
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-mid/40 w-7 shrink-0">
                  {dim.bad}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* PSQI Explanation */}
      <div className="px-4 py-3 bg-primary/5 rounded-2xl space-y-1">
        <p className="text-xs font-medium text-primary">什么是 PSQI？</p>
        <p className="text-[11px] text-gray-mid/80 leading-relaxed">
          PSQI（匹兹堡睡眠质量指数）是评估成人近1个月睡眠质量的标准化工具，包含7个维度，总分0-21分。分数越高表明睡眠质量越差，临床普遍认为总分≥8分提示存在显著睡眠问题。
        </p>
      </div>
    </motion.div>
  );
}
