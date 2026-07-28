import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm active:scale-[0.98]',
        secondary: 'bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200 font-semibold dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700',
        outline: 'border border-slate-300 bg-white dark:bg-transparent text-slate-800 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-900 hover:border-indigo-300 dark:hover:bg-slate-800/70 dark:border-slate-700 shadow-sm font-semibold',
        ghost: 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 font-medium',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-12 px-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
