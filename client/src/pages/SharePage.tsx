import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { AssessmentResult } from '../../../shared/types';
import ShareCard from '../components/ShareCard';
import Button from '../components/Button';

export default function SharePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    result?: AssessmentResult;
  };

  // If no state, redirect to home
  if (!state?.result) {
    navigate('/', { replace: true });
    return null;
  }

  const { result } = state;

  const handleCopyLink = useCallback(async () => {
    const shareText = `我是「${result.primary_persona_name}」- ${result.share_nickname}，快来测测你的睡眠人格吧！`;
    const fullUrl = `${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(`${shareText}\n${fullUrl}`);
      alert('分享链接已复制到剪贴板！');
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = `${shareText}\n${fullUrl}`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('分享链接已复制到剪贴板！');
    }
  }, [result]);

  return (
    <div className="page-container">
      {/* Fixed header */}
      <motion.div
        className="text-center pb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-xl font-bold text-dark">分享你的眠格</h1>
        <p className="text-xs text-gray-mid/60">
          让朋友也来发现他们的睡眠人格
        </p>
      </motion.div>

      {/* Scrollable content */}
      <div className="page-scroll flex flex-col justify-center">
        <ShareCard result={result} />
      </div>

      {/* Fixed bottom actions */}
      <motion.div
        className="pt-4 space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button onClick={handleCopyLink}>
          复制分享链接
        </Button>
        <div className="flex gap-2">
          <Button
            variant="text"
            onClick={() => navigate(`/result/${state?.assessmentId || ''}`)}
            fullWidth={false}
            className="flex-1 text-center"
          >
            ← 返回报告
          </Button>
          <Button variant="text" onClick={() => navigate('/')} fullWidth={false} className="px-4">
            首页
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
