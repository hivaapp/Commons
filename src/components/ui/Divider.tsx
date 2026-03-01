import { cn } from '../../lib/utils';

interface DividerProps {
    className?: string;
}

export function Divider({ className }: DividerProps) {
    return (
        <hr
            className={cn('my-4 border-t border-commons-border', className)}
        />
    );
}
