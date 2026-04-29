import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * @param {{ goal: string }} props
 */
export default function GoalBadge({ goal }) {
  const isFem = goal !== 'masculinize';

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
        isFem
          ? 'bg-primary/10 border-primary/20 text-primary'
          : 'bg-accent/10 border-accent/20 text-accent'
      }`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      {isFem ? 'Feminize Voice' : 'Masculinize Voice'}
    </div>
  );
}