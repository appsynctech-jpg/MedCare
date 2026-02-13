import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// --- Neo-Tactile Card ---
// Glassmorphism + Soft shadows + Rounded corners
export const NeoCard = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "relative overflow-hidden rounded-[32px]",
            "bg-white/5 dark:bg-black/20",
            "backdrop-blur-2xl border border-white/10 dark:border-white/5",
            "shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]",
            className
        )}
        {...props}
    >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
            {children}
        </div>
    </div>
);

// --- Neo-Tactile Button ---
// Dynamic states, soft feel
interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    active?: boolean;
}

export const NeoButton = ({ className, variant = 'primary', active, children, ...props }: NeoButtonProps) => {
    const variants = {
        primary: active
            ? "bg-blue-600 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_20px_rgba(37,99,235,0.5)] border-transparent"
            : "bg-white/10 text-foreground hover:bg-white/20 border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        secondary: "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 border-transparent",
        ghost: "bg-transparent text-muted-foreground hover:text-foreground",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
                "px-6 py-3 rounded-2xl font-medium transition-all duration-300",
                "border backdrop-blur-md flex items-center justify-center gap-2",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
};

// --- Neo-Tactile Checkbox/Toggle ---
export const NeoToggle = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) => (
    <div
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            "w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 border border-white/5",
            checked ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-black/20"
        )}
    >
        <motion.div
            className="w-6 h-6 rounded-full bg-white shadow-md"
            animate={{ x: checked ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
    </div>
);

// --- Neo-Tactile Input ---
// Inset style
export const NeoInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div className="relative group">
                <input
                    ref={ref}
                    className={cn(
                        "w-full px-5 py-4 rounded-2xl outline-none transition-all",
                        "bg-black/5 dark:bg-black/40 border border-white/5",
                        "shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]",
                        "focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_0_0_2px_rgba(37,99,235,0.3)]",
                        "placeholder:text-muted-foreground/50 text-foreground",
                        className
                    )}
                    {...props}
                />
            </div>
        )
    }
)
NeoInput.displayName = "NeoInput";
