import { motion } from 'framer-motion';
import type { AssessmentResult } from '../../../shared/types';
import TagBubble from './TagBubble';

interface ShareCardProps {
  result: AssessmentResult;
}

const tagVariants: ('pink' | 'blue' | 'purple')[] = ['pink', 'blue', 'purple'];

export default function ShareCard({ result }: ShareCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      id="share-card"
      className="relative overflow-hidden bg-gradient-to-br from-white to-primary-light/10 rounded-4xl shadow-strong p-6"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <img
        src="/assets/bg-stars.png"
        alt=""
        className="absolute top-4 right-4 w-16 opacity-30"
        crossOrigin="anonymous"
      />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Result image */}
        <div className="w-28 h-28 mx-auto">
          <img
            src={`/assets/${result.image}`}
            alt={result.primary_persona_name}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
          />
        </div>

        {/* Personality title */}
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-mid/60 font-medium">我的睡眠人格</p>
          <h3 className="text-lg font-bold text-dark">
            {result.primary_persona_name}
          </h3>
          <p className="text-sm text-primary font-medium">
            {result.share_nickname}
          </p>
        </div>

        {/* Tags */}
        {result.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {result.tags.map((tag, i) => (
              <TagBubble
                key={tag}
                label={tag}
                variant={tagVariants[i % tagVariants.length]}
              />
            ))}
          </div>
        )}

        {/* Level */}
        <div className="text-center">
          <span className="inline-block px-4 py-1 bg-dark/5 rounded-full text-xs text-gray-mid">
            {result.level}
          </span>
        </div>

        {/* Brand */}
        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-mid/50">眠格自测｜解锁专属睡眠人格报告</p>
        </div>
      </div>
    </motion.div>
  );
}
