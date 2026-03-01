import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-commons-brand text-white hover:bg-commons-brandHover focus:ring-commons-brand',
    secondary:
        'bg-white border border-commons-border text-commons-text hover:bg-commons-surfaceAlt',
    ghost:
        'bg-transparent text-commons-textMid hover:text-commons-text',
    danger:
        'bg-commons-error text-white hover:bg-[#A93226] focus:ring-commons-error',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', fullWidth, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    'disabled:pointer-events-none disabled:opacity-50',
                    variantStyles[variant],
                    fullWidth && 'w-full',
                    className,
                )}
                disabled={disabled}
                {...props}
            >
                {children}
            </button>
        );
    },
);

Button.displayName = 'Button';
