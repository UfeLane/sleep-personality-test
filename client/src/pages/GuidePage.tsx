import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';

const guideSteps = [
  {
    icon: '📝',
    title: '16 道轻松选择题',
    desc: '每道题约 30 秒，共约 8 分钟',
  },
  {
    icon: '🧠',
    title: '科学评估模型',
    desc: '基于 PSQI-Lite 七维睡眠质量评分',
  },
  {
    icon: '📊',
    title: '专属睡眠人格报告',
    desc: '6 种人格类型，发现你的睡眠模式',
  },
  {
    icon: '🔒',
    title: '隐私保护',
    desc: '匿名收集统计数据用于改善服务，无法追溯到个人',
  },
];

export default function GuidePage() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      {/* Fixed header */}
      <motion.div
        className="text-center pt-2 pb-4 space-y-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-dark">测评说明</h1>
        <p className="text-sm text-gray-mid/70">
          在开始之前，先了解一下测评流程
        </p>
      </motion.div>

      {/* Scrollable content */}
      <div className="page-scroll space-y-3">
        {/* Guide character */}
        <motion.div
          className="w-32 h-32 mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <img
            src="/assets/guide-character.png"
            alt="测评引导"
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* Steps */}
        <div className="space-y-2">
          {guideSteps.map((step, index) => (
            <motion.div
              key={index}
              className="glass-card p-4 flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            >
              <span className="text-2xl">{step.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-dark">{step.title}</h3>
                <p className="text-xs text-gray-mid/70">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.div
          className="px-4 py-3 bg-amber-50/80 border border-amber-200/50 rounded-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-amber-700/80 leading-relaxed text-center">
            本测评结果基于睡眠行为自评，仅供参考和科普目的，
            不构成医疗诊断。如有睡眠困扰，请咨询专业医生。
          </p>
          <p className="text-[10px] text-gray-mid/40 text-center pt-2">
            🤝 匿名收集统计结果用于改善服务，不收集个人信息，无法追溯到个人
          </p>
        </motion.div>
      </div>

      {/* Fixed bottom CTA */}
      <motion.div
        className="pt-4 space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Button onClick={() => navigate('/quiz')}>
          开始答题
        </Button>
        <Button
          variant="text"
          onClick={() => navigate('/')}
          fullWidth={false}
          className="mx-auto block"
        >
          返回首页
        </Button>
      </motion.div>
    </div>
  );
}
