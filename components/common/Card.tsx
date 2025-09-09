
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-card shadow-sm rounded-xl p-6 border border-border ${className}`}>
      {children}
    </div>
  );
};

export default Card;