import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ShieldAlert } from 'lucide-react';
import { BrutalTag } from './ui/BrutalTag';
import { COMMON_EXCLUSION_TAGS } from '@shared/index';

interface ExclusionTagsProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export function ExclusionTags({ tags, onAdd, onRemove }: ExclusionTagsProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = COMMON_EXCLUSION_TAGS.filter(
    (tag) =>
      tag.toLowerCase().includes(input.toLowerCase()) &&
      !tags.includes(tag)
  );

  const handleAdd = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onAdd(tag.trim());
    }
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      handleAdd(input);
    }
  };

  return (
    <div className="space-y-4">
      <label className="font-bold text-deep-black/60 text-sm uppercase tracking-wide flex items-center gap-2">
        <ShieldAlert size={14} strokeWidth={3} />
        Exclusions / Allergies
      </label>

      <div className="relative">
        <div className="relative">
          <Search
            size={16}
            strokeWidth={2.5}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-black/30"
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une allergie ou intolérance..."
            className="input-brutal w-full pl-11"
          />
        </div>

        <AnimatePresence>
          {showSuggestions && input.length > 0 && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 w-full mt-2 bg-off-white border-2 border-deep-black/15 rounded-2xl overflow-hidden max-h-48 overflow-y-auto"
              style={{ boxShadow: '0 12px 40px rgba(26,26,26,0.1)' }}
            >
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAdd(suggestion);
                  }}
                  className="w-full text-left px-5 py-2.5 font-medium text-sm hover:bg-mauve/10 transition-colors border-b border-deep-black/5 last:border-b-0"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[36px]">
        <AnimatePresence>
          {tags.map((tag) => (
            <BrutalTag key={tag} label={tag} onRemove={() => onRemove(tag)} />
          ))}
        </AnimatePresence>
        {tags.length === 0 && (
          <span className="text-sm text-deep-black/30 italic font-medium">
            Aucune exclusion sélectionnée
          </span>
        )}
      </div>
    </div>
  );
}
