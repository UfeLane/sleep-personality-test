import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const loadingMessages = [
  '正在分析你的睡眠模式...',
  '探索你的入睡习惯...',
  '评估你的睡眠连续性...',
  '计算你的日间精力状况...',
  '匹配专属人格画像...',
  '生成你的睡眠人格报告...',
];

export default function LoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const assessmentId = (location.state as { assessmentId?: string })?.assessmentId;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!assessmentId) {
      navigate('/', { replace: true });
      return;
    }

    // Cycle through messages
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < loadingMessages.length - 1 ? prev + 1 : prev
      );
    }, 600);

    // Navigate to result after "analysis" is complete
    const timer = setTimeout(() => {
      navigate(`/result/${assessmentId}`, { replace: true });
    }, 3500);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(timer);
    };
  }, [assessmentId, navigate]);

  return (
    <div className="page-container items-center justify-center">
      {/* Animated graphics */}
      <div className="relative w-40 h-40">
        <motion.img
          src="/assets/zzz.png"
          alt=""
          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 object-contain"
          animate={{
            y: [0, -20, 0],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.img
          src="/assets/sleep-mask.png"
          alt=""
          className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 object-contain"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.img
          src="/assets/pillow.png"
          alt=""
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 object-contain"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Message */}
      <div className="h-8 mt-8 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            className="text-sm text-gray-mid/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {loadingMessages[Math.min(messageIndex, loadingMessages.length - 1)]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-4">
        {loadingMessages.map((_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i <= messageIndex ? 'bg-primary' : 'bg-gray-200'
            }`}
            animate={{ scale: i === messageIndex ? 1.3 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
