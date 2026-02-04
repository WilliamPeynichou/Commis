import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface BrutalTagProps {
  label: string;
  onRemove: () => void;
}

export function BrutalTag({ label, onRemove }: BrutalTagProps) {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className="tag-brutal group"
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-all duration-150 group-hover:scale-110"
        aria-label={`Retirer ${label}`}
      >
        <X size={13} strokeWidth={3} />
      </button>
    </motion.span>
  );
}
