'use client';

import { ReactNode, useEffect, useRef } from 'react';

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export default function NeonCard({
  children,
  className = '',
  hover = true,
  delay = 0
}: NeonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      // Set animation delays for the neon borders
      const borders = cardRef.current.querySelectorAll('.neon-border-top, .neon-border-right, .neon-border-bottom, .neon-border-left');
      borders.forEach((border, index) => {
        const delays = [0, 0.75, 1.5, 2.25];
        (border as HTMLElement).style.animationDelay = `${delay + delays[index]}s`;
      });
    }
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 border-2 border-cyan-400/50 shadow-lg shadow-cyan-400/20 transition-all duration-300 ${hover ? 'hover:shadow-cyan-400/30' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
