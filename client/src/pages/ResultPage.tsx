import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getResult } from '../api';
import type { AssessmentResponse } from '../../../shared/types';
import TagBubble from '../components/TagBubble';
import DoctorReminder from '../components/DoctorReminder';
import ResultCard from '../components/ResultCard';
import Button from '../components/Button';

const tagVariants: ('pink' | 'blue' | 'purple')[] = ['pink', 'blue', 'purple'];

export default function ResultPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!assessmentId) {
      navigate('/', { replace: true });
      return;
    }

    getResult(assessmentId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || '加载结果失败');
        setLoading(false);
      });
  }, [assessmentId, navigate]);

  if (loading) {
    return (
      <div className="page-container items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 mx-auto">
            <img
              src="/assets/zzz.png"
              alt=""
              className="w-full h-full object-contain animate-pulse-soft"
            />
          </div>
          <p className="text-sm text-gray-mid/70">加载结果中...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-500">{error || '未找到结果'}</p>
          <Button onClick={() => navigate('/')}>重新开始</Button>
        </div>
      </div>
    );
  }

  const { result, scores, persona_scores } = data;

  return (
    <div className="page-container">
      {/* Fixed header */}
      <motion.div
        className="text-center pb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs text-gray-mid/50 font-medium">你的睡眠人格报告</p>
      </motion.div>

      {/* Scrollable content */}
      <div className="page-scroll space-y-4">
        {/* Result hero */}
        <motion.div
          className="glass-card p-5 text-center space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            className="w-32 h-32 mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <img
              src={`/assets/${result.image}`}
              alt={result.primary_persona_name}
              className="w-full h-full object-contain"
            />
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-dark">
              {result.primary_persona_name}
            </h2>
            <p className="text-primary font-medium text-sm">
              {result.share_nickname}
            </p>
          </div>
          {result.secondary_persona && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/5 rounded-full">
              <span className="text-xs text-accent">
                辅人格: {result.secondary_persona === 'P01' ? '卧床空想家' :
                         result.secondary_persona === 'P02' ? '夜半断线玩家' :
                         result.secondary_persona === 'P03' ? '拂晓强制开机人' :
                         result.secondary_persona === 'P04' ? '全天续航透支者' :
                         result.secondary_persona === 'P05' ? '深夜自留夜猫客' : ''}
              </span>
            </div>
          )}
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {result.tags.map((tag, i) => (
                <TagBubble key={tag} label={tag} variant={tagVariants[i % tagVariants.length]} />
              ))}
            </div>
          )}
          <div>
            <span className="inline-block px-4 py-1.5 bg-dark/5 rounded-full text-xs text-gray-mid font-medium">
              {result.level}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-soft">
              <span className="text-sm font-bold text-white">{scores.sleep_wellness_score}</span>
            </div>
            <span className="text-xs text-gray-mid/70">睡眠健康指数</span>
          </div>
        </motion.div>

        {/* Reminders */}
        <DoctorReminder
          showDoctorReminder={result.show_doctor_reminder}
          showMedicationNotice={result.show_medication_notice}
        />

        {/* Description */}
        <motion.div
          className="glass-card p-5 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold text-dark">
            关于{result.primary_persona_name}
          </h3>
          <p className="text-xs text-gray-mid/80 leading-relaxed">
            {result.primary_persona === 'P01'
              ? '你的大脑在夜晚格外活跃，一躺下就开始上演各种剧情。入睡对你来说不是关灯就睡，而是一场与思绪的较量。'
              : result.primary_persona === 'P02'
              ? '你的睡眠像一场断断续续的连线游戏——睡着没问题，但维持一整晚的连续睡眠才是真正的挑战。'
              : result.primary_persona === 'P03'
              ? '你的生物钟比闹钟还敬业，每天天还没亮就把你从睡梦中唤醒。早醒让你的睡眠时长被压缩。'
              : result.primary_persona === 'P04'
              ? '你就像一个永远在低电量模式下运行的手机——白天总是提不起精神，注意力难以集中。'
              : result.primary_persona === 'P05'
              ? '夜晚对你来说是一天中最珍贵的自由时光。你明知该睡了，却舍不得结束这完全属于自己的时间。'
              : '你是让人羡慕的「天赋型睡眠选手」！你的睡眠质量整体稳定，身体和精神能够得到充分的恢复。'}
          </p>
        </motion.div>

        {/* Toggle scores — prominent button */}
        <motion.button
          onClick={() => setShowDetail(!showDetail)}
          className="w-full flex items-center justify-between px-5 py-3.5 glass-card border border-primary/10"
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-sm font-medium text-dark">
            {showDetail ? '收起详细评分' : '查看详细评分'}
          </span>
          <motion.span
            className="text-primary text-lg"
            animate={{ rotate: showDetail ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ▼
          </motion.span>
        </motion.button>
        {showDetail && <ResultCard result={result} scores={scores} />}
      </div>

      {/* Fixed bottom actions */}
      <motion.div
        className="pt-4 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button onClick={() => navigate('/share', { state: { result, scores, assessmentId } })}>
          分享结果
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/quiz')} className="flex-1">
            重新测试
          </Button>
          <Button variant="text" onClick={() => navigate('/')} fullWidth={false} className="px-4">
            首页
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
