import { forwardRef } from 'react';
import { cn } from '../lib/utils';

const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
    return (
        <input
            type={type}
            ref={ref}
            className={cn(
                'flex h-11 w-full rounded-xl border px-4 py-2 text-sm',
                'bg-[var(--input)] border-[var(--border)]',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
                'transition-all duration-200 outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'font-mono tracking-wide',
                className
            )}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export { Input };
