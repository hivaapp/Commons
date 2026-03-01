import { memo } from 'react';
import { cn } from '../../lib/utils';

interface StatNumberProps {
    value: string;
    label: string;
    variant?: 'default' | 'money';
    className?: string;
}

export const StatNumber = memo(function StatNumber({
    value,
    label,
    variant = 'default',
    className,
}: StatNumberProps) {
    return (
        <div className={cn('text-left', className)}>
            <p
                className={cn(
                    'text-[32px] font-bold leading-tight',
                    variant === 'money' ? 'text-commons-success' : 'text-commons-text',
                )}
            >
                {value}
            </p>
            <p className="mt-0.5 text-xs text-commons-textMid">{label}</p>
        </div>
    );
});
