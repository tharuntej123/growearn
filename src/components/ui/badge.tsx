import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        secondary:
          'border-transparent bg-slate-100 text-slate-700 border border-slate-200',
        success:
          'border-transparent bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        warning:
          'border-transparent bg-amber-50 text-amber-800 border border-amber-200',
        destructive:
          'border-transparent bg-rose-50 text-rose-700 border border-rose-200',
        purple:
          'border-transparent bg-purple-50 text-purple-700 border border-purple-200',
        cyan:
          'border-transparent bg-sky-50 text-sky-700 border border-sky-200',
        outline: 'text-slate-700 border-slate-300 bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
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
