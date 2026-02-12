import { useEffect, useState, useRef } from 'react';
import { usePanic } from '@/hooks/usePanic';
import { useAuth } from '@/hooks/useAuth';

export function PanicShortcutListener() {
    const { user } = useAuth();
    const { triggerPanic } = usePanic();
    const [holding, setHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<any>(null);
    const progressIntervalRef = useRef<any>(null);

    useEffect(() => {
        if (!user) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Trigger on 'Space' key (code 'Space')
            // Only trigger if not already holding and not in an input/textarea
            if (e.code === 'Space' && !holding &&
                !(e.target instanceof HTMLInputElement) &&
                !(e.target instanceof HTMLTextAreaElement)) {

                setHolding(true);
                setProgress(0);

                const startTime = Date.now();
                const duration = 3000; // 3 seconds

                progressIntervalRef.current = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const p = Math.min((elapsed / duration) * 100, 100);
                    setProgress(p);
                    if (p >= 100) {
                        clearInterval(progressIntervalRef.current!);
                    }
                }, 50);

                timerRef.current = setTimeout(() => {
                    triggerPanic();
                    setHolding(false);
                    setProgress(0);
                    clearInterval(progressIntervalRef.current!);
                }, duration);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                if (timerRef.current) clearTimeout(timerRef.current);
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                setHolding(false);
                setProgress(0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [user, holding, triggerPanic]);

    if (!holding) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-1.5 z-[9999] bg-black/10">
            <div
                className="h-full bg-destructive transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                style={{ width: `${progress}%` }}
            />
            <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-destructive text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse shadow-lg flex items-center gap-2">
                <span>🚨 SEGURE ESPAÇO PARA PÂNICO</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{Math.ceil((100 - progress) / 33)}s</span>
            </div>
        </div>
    );
}
