import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-card rounded-lg p-6 border border-border shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export default Card;