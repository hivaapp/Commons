import { memo } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'brand';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-commons-successBg text-commons-success',
    warning: 'bg-commons-warningBg text-commons-warning',
    error: 'bg-commons-errorBg text-commons-error',
    neutral: 'bg-commons-surfaceAlt text-commons-textMid',
    brand: 'bg-commons-brandTint text-commons-brand',
};

export const Badge = memo(function Badge({
    variant = 'neutral',
    children,
    className,
}: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium',
                variantStyles[variant],
                className,
            )}
        >
            {children}
        </span>
    );
});
