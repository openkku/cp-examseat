// src/components/layout/PageTransition.tsx
import React from 'react';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full h-full flex flex-col animate-slide-up">
      {children}
    </div>
  );
};
