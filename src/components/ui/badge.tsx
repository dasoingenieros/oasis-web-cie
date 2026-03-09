import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-50 text-brand-600',
        secondary: 'border-transparent bg-surface-100 text-surface-600',
        destructive: 'border-transparent bg-red-50 text-red-600',
        success: 'border-transparent bg-emerald-50 text-emerald-600',
        warning: 'border-transparent bg-amber-50 text-amber-600',
        outline: 'border-surface-300 text-surface-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
