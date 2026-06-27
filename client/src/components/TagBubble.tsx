interface TagBubbleProps {
  label: string;
  variant?: 'pink' | 'blue' | 'purple';
}

const variantStyles = {
  pink: 'bg-primary/10 text-primary border-primary/20',
  blue: 'bg-accent/10 text-accent border-accent/20',
  purple: 'bg-blue-dark/10 text-blue-dark border-blue-dark/20',
};

const tagImages = {
  pink: '/assets/tag-bubble-pink.png',
  blue: '/assets/tag-bubble-blue.png',
  purple: '/assets/tag-bubble-purple.png',
};

export default function TagBubble({ label, variant = 'pink' }: TagBubbleProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-medium ${variantStyles[variant]}`}
    >
      <img src={tagImages[variant]} alt="" className="w-4 h-4 object-contain" />
      {label}
    </div>
  );
}
