import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../lib/utils';

const Slider = React.forwardRef(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn(
            'relative flex w-full touch-none select-none items-center py-2',
            className
        )}
        {...props}
    >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--muted)]">
            <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[var(--primary-dark)] via-[var(--primary)] to-[var(--gradient-end)]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--primary)] bg-[var(--background)] shadow-lg shadow-[var(--primary)]/30 ring-[var(--primary)]/50 transition-all duration-200 hover:scale-110 hover:shadow-[var(--primary)]/50 focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing active:scale-95" />
    </SliderPrimitive.Root>
));

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
