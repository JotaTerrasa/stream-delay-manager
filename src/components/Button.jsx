import { forwardRef } from 'react';
import { cn } from '../lib/utils';

const Button = forwardRef(({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
        default: 'bg-[var(--primary)] hover:bg-[var(--primary-light)] text-[var(--primary-foreground)] font-semibold',
        gradient: 'bg-gradient-to-r from-[var(--primary-dark)] via-[var(--primary)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold shadow-lg glow-purple',
        success: 'bg-[var(--success)] hover:bg-[var(--success)]/90 text-white shadow-lg glow-success',
        danger: 'bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 text-white shadow-lg glow-danger',
        muted: 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-60',
        ghost: 'bg-transparent hover:bg-[var(--accent)] text-[var(--foreground)]',
        outline: 'bg-transparent border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)]',
    };

    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm',
                'transition-all duration-300 outline-none',
                'disabled:pointer-events-none disabled:opacity-50',
                'focus-visible:ring-2 focus-visible:ring-[var(--ring)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
                'active:scale-[0.98]',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export { Button };
