import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-1 block text-xs text-commons-textMid"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'h-10 w-full rounded-md border bg-white px-3 text-sm transition-colors',
                        'placeholder:text-commons-textLight',
                        'focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand',
                        'disabled:bg-commons-surfaceAlt disabled:text-commons-textMid',
                        error
                            ? 'border-commons-error focus:border-commons-error focus:ring-commons-error'
                            : 'border-commons-border',
                        className,
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-commons-error">{error}</p>
                )}
            </div>
        );
    },
);

Input.displayName = 'Input';
