import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { classNames } from '~/utils/classNames';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bolt-elements-borderColor disabled:pointer-events-none disabled:opacity-50 glass-button',
  {
    variants: {
      variant: {
        default: 'text-bolt-elements-textPrimary hover:text-white',
        destructive: 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        outline:
          'border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:text-white',
        secondary:
          'text-bolt-elements-textPrimary hover:text-white',
        ghost: 'border-transparent hover:text-white hover:border-[#8EFD47]/60',
        link: 'text-bolt-elements-textPrimary underline-offset-4 hover:underline border-transparent backdrop-filter-none bg-transparent shadow-none',
      },
      size: {
        default: 'h-9 px-4 py-2 rounded-xl',
        sm: 'h-8 px-3 text-xs rounded-lg',
        lg: 'h-10 px-8 rounded-xl',
        icon: 'h-9 w-9 rounded-xl',
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
  _asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, _asChild = false, ...props }, ref) => {
    return <button className={classNames(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
