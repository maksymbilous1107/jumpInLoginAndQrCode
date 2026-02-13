
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`liquid-glass p-8 rounded-[2rem] w-full max-w-md mx-auto animate-in fade-in zoom-in duration-700 ${className}`}>
      {children}
    </div>
  );
};
