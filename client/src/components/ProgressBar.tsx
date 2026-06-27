import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full space-y-2">
      {/* Dots indicator */}
      <div className="flex items-center gap-1.5 justify-center">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`progress-dot transition-all duration-300 ${
              i < current
                ? 'progress-dot-done'
                : i === current
                ? 'progress-dot-active'
                : 'progress-dot-pending'
            }`}
          />
        ))}
      </div>

      {/* Percentage bar */}
      <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-light rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <p className="text-center text-sm text-gray-mid/70">{percentage}%</p>
    </div>
  );
}
