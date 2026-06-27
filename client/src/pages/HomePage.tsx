import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="w-full cursor-pointer"
      style={{ height: '100dvh', maxWidth: 480, margin: '0 auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onClick={() => navigate('/guide')}
    >
      <img
        src="/assets/new-cover.png"
        alt="眠格自测 - 点击开始"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </motion.div>
  );
}
