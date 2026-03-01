import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    heading: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, heading, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('pt-[160px] text-center', className)}>
            <Icon className="mx-auto h-8 w-8 text-commons-textLight" strokeWidth={1.5} />
            <h3 className="mt-3 text-base font-semibold text-commons-text">{heading}</h3>
            <p className="mx-auto mt-1 max-w-[240px] text-sm text-commons-textMid">
                {description}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
