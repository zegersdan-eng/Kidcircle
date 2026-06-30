import { useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '⭐' },
  { id: 'stem', label: 'STEM', icon: '🧩' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'arts', label: 'Arts', icon: '🎨' },
  { id: 'tutoring', label: 'Tutoring', icon: '📚' },
  { id: 'language', label: 'Language', icon: '🗣️' },
  { id: 'summer-camp', label: 'Camp', icon: '🏕️' },
  { id: 'dance', label: 'Dance', icon: '💃' },
  { id: 'cooking', label: 'Cooking', icon: '🍳' },
];

export default function CategoryChips({ activeCategory, onCategoryChange }) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4">
      <div className="flex gap-2 pb-2 min-w-max">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange?.(cat.id)}
            className={`category-chip ${
              activeCategory === cat.id ? 'active' : ''
            }`}
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}