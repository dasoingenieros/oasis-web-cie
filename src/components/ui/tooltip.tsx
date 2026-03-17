'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'right';
  maxWidth?: number;
}

export function Tooltip({ content, children, className, side = 'top', maxWidth }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  const arrowMap = {
    top: (
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
        <div className="w-2 h-2 bg-surface-900 rotate-45 -translate-y-1" />
      </div>
    ),
    bottom: (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-px">
        <div className="w-2 h-2 bg-surface-900 rotate-45 translate-y-1" />
      </div>
    ),
    right: (
      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-px">
        <div className="w-2 h-2 bg-surface-900 rotate-45 translate-x-1" />
      </div>
    ),
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="cursor-help"
      >
        {children}
      </div>
      {open && (
        <div
          className={cn(
            'absolute z-50',
            positionClasses[side],
            'rounded-md bg-surface-900 text-white text-xs px-2.5 py-1.5',
            'shadow-md whitespace-pre-line leading-relaxed',
            className,
          )}
          style={{ maxWidth: maxWidth ?? 260 }}
        >
          {content}
          {arrowMap[side]}
        </div>
      )}
    </div>
  );
}
