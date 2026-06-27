import { motion } from 'framer-motion';

interface OptionButtonProps {
  label: string;
  value: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function OptionButton({
  label,
  value,
  isSelected,
  onClick,
}: OptionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-3xl border-2 transition-all duration-200
        ${
          isSelected
            ? 'border-primary bg-primary/5 shadow-soft'
            : 'border-transparent bg-white shadow-soft hover:shadow-medium'
        }`}
      whileTap={{ scale: 0.98 }}
      initial={false}
    >
      <div className="flex items-center gap-3">
        {/* Selection indicator */}
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200
            ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}
        >
          {isSelected && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path d="M20 6L9 17l-5-5" />
            </motion.svg>
          )}
        </div>

        {/* Label */}
        <span
          className={`text-sm leading-snug ${
            isSelected ? 'text-primary font-medium' : 'text-dark'
          }`}
        >
          {label}
        </span>
      </div>
    </motion.button>
  );
}
