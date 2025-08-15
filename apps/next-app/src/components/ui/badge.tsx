import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-r from-primary to-primary/90 text-white shadow-apple-blue hover:shadow-apple',
        secondary:
          'border-transparent bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-apple hover:shadow-apple-lg',
        destructive:
          'border-transparent bg-gradient-to-r from-destructive to-destructive/90 text-white shadow-apple hover:shadow-apple-lg',
        outline:
          'text-foreground border-border/50 bg-background/50 backdrop-blur-apple shadow-apple',
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
