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
      className={`relative rounded-xl p-6  ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
      }}
    >
      {/* Scanning neon effects around the edges */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top edge */}
        <div
          className="neon-border-top absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80"
        />

        {/* Right edge */}
        <div
          className="neon-border-right absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-80"
        />

        {/* Bottom edge */}
        <div
          className="neon-border-bottom absolute bottom-0 left-0 w-full h-1 bg-gradient-to-l from-transparent via-blue-400 to-transparent opacity-80"
        />

        {/* Left edge */}
        <div
          className="neon-border-left absolute top-0 left-0 w-1 h-full bg-gradient-to-t from-transparent via-blue-400 to-transparent opacity-80"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 bg-[#F3F4F6] rounded-lg h-full">
        {children}
      </div>
    </div>
  );
}
