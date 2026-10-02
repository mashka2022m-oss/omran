import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 artistic-pattern">
      {/* Ambient Gradient Orbs dynamically adapted to complex theme */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
        style={{ backgroundColor: 'var(--complex-secondary, #065f46)' }}
      />
      <div
        className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: 'var(--complex-accent, #fbbf24)', animationDuration: '9s' }}
      />
      <div
        className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-40 animate-pulse"
        style={{ backgroundColor: 'var(--complex-primary, #064e3b)', animationDuration: '7s' }}
      />
      
      {/* Golden Matrix Highlight Overlay */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(251, 191, 36, 0.08) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} 
      />
    </div>
  );
};
