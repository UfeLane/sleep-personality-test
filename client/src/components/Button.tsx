import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  fullWidth = true,
}: ButtonProps) {
  const base = 'font-medium text-center transition-all duration-300 select-none';
  const width = fullWidth ? 'w-full' : '';

  const variants = {
    primary:
      'bg-primary text-white px-8 py-4 rounded-pill shadow-strong hover:brightness-110 active:scale-[0.98] disabled:opacity-50',
    secondary:
      'bg-white text-dark border border-gray-200 px-8 py-4 rounded-pill shadow-soft hover:shadow-medium active:scale-[0.98]',
    text: 'text-primary px-4 py-2 hover:bg-primary/5 rounded-xl',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${width} ${className}`}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
    >
      {children}
    </motion.button>
  );
}
