import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '../../../shared/types';
import OptionButton from './OptionButton';

interface QuestionCardProps {
  question: Question;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({
  question,
  selectedIndex,
  onSelect,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-6"
      >
        {/* Question header */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-primary/60 uppercase tracking-wider">
            第 {questionNumber}/{totalQuestions} 题
          </span>
          <h2 className="text-xl font-semibold text-dark leading-snug">
            {question.title}
          </h2>
          {question.subtitle && (
            <p className="text-sm text-gray-mid/80">{question.subtitle}</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <OptionButton
              key={index}
              label={option.label}
              value={option.value}
              isSelected={selectedIndex === index}
              onClick={() => onSelect(index)}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
