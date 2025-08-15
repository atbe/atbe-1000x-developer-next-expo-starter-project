import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-primary to-primary/90 text-white shadow-apple-blue hover:shadow-apple-lg hover:scale-[1.02] active:scale-[0.98] rounded-2xl',
        destructive:
          'bg-gradient-to-br from-destructive to-destructive/90 text-white shadow-apple hover:shadow-apple-lg hover:scale-[1.02] active:scale-[0.98] rounded-2xl',
        outline:
          'border border-border/50 bg-background/50 backdrop-blur-apple shadow-apple hover:bg-accent/50 hover:shadow-apple-lg hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-foreground',
        secondary:
          'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-apple hover:shadow-apple-lg hover:scale-[1.02] active:scale-[0.98] rounded-2xl',
        ghost:
          'hover:bg-accent/50 hover:shadow-apple rounded-2xl text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 px-4 py-2 text-xs rounded-xl',
        lg: 'h-12 px-8 py-4 text-base rounded-3xl',
        icon: 'h-11 w-11 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
