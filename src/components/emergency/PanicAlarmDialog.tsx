import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BellOff, MapPin, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { useFamily } from '@/hooks/useFamily';

export function PanicAlarmDialog() {
    const { activePanicAlert, dismissPanicAlert } = useFamily();
    const [isMuted, setIsMuted] = useState(false);
    const [playError, setPlayError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (activePanicAlert && !isMuted) {
            if (!audioRef.current) {
                audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audioRef.current.loop = true;
            }
            audioRef.current.play()
                .then(() => setPlayError(false))
                .catch(e => {
                    console.warn('Audio play blocked:', e);
                    setPlayError(true);
                });
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [activePanicAlert, isMuted]);

    if (!activePanicAlert) return null;

    const googleMapsUrl = activePanicAlert.latitude && activePanicAlert.longitude
        ? `https://www.google.com/maps?q=${activePanicAlert.latitude},${activePanicAlert.longitude}`
        : null;

    const handleDismiss = () => {
        dismissPanicAlert();
        setIsMuted(false);
        setPlayError(false);
    };

    const handleManualPlay = () => {
        if (audioRef.current) {
            audioRef.current.play()
                .then(() => {
                    setPlayError(false);
                    setIsMuted(false);
                })
                .catch(e => console.error("Manual play failed:", e));
        }
    };

    return (
        <Dialog open={!!activePanicAlert} onOpenChange={(open) => !open && handleDismiss()}>
            <DialogContent className="max-w-md border-none bg-red-600/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden ring-4 ring-red-500/50 animate-in zoom-in-95 duration-300 text-white z-[9999]">
                <div className="p-8 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 animate-pulse" />

                    <DialogHeader className="relative flex-col items-center space-y-4">
                        <div className="bg-white/20 p-4 rounded-full animate-bounce shadow-inner">
                            <ShieldAlert className="h-12 w-12 text-white" />
                        </div>
                        <div className="space-y-1 text-center">
                            <DialogTitle className="text-3xl font-black tracking-tight text-white uppercase italic">
                                Emergência Ativada!
                            </DialogTitle>
                            <DialogDescription className="text-white/80 font-medium">
                                Um familiar precisa de ajuda imediata.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="relative p-6 rounded-2xl bg-white/10 border border-white/20 shadow-lg space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Familiar</p>
                            <h3 className="text-2xl font-black">{activePanicAlert.patientName}</h3>
                        </div>

                        {activePanicAlert.message && (
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                <p className="text-sm italic italic">"{activePanicAlert.message}"</p>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2 text-xs font-bold bg-black/20 py-2 rounded-full px-4">
                            <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                                {new Date(activePanicAlert.created_at).toLocaleTimeString('pt-BR')}
                            </Badge>
                            <span className="opacity-70">HOJE</span>
                        </div>
                    </div>

                    <div className="relative space-y-3 pt-2">
                        {googleMapsUrl && (
                            <Button
                                className="w-full h-14 rounded-xl bg-white text-red-600 hover:bg-white/90 font-black text-lg shadow-xl"
                                asChild
                            >
                                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                    <MapPin className="mr-2 h-6 w-6" /> VER LOCALIZAÇÃO
                                </a>
                            </Button>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {playError ? (
                                <Button
                                    className="h-12 rounded-xl font-black bg-white text-red-600 hover:bg-white/90 animate-bounce shadow-lg"
                                    onClick={handleManualPlay}
                                >
                                    <ShieldAlert className="mr-2 h-5 w-5" /> ATIVAR SIRENE
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="h-12 rounded-xl font-bold bg-transparent border-white/30 text-white hover:bg-white/10"
                                    onClick={() => setIsMuted(!isMuted)}
                                >
                                    {isMuted ? <BellOff className="mr-2 h-4 w-4" /> : <ShieldAlert className="mr-2 h-4 w-4 animate-pulse" />}
                                    {isMuted ? 'MUDAR' : 'SILENCIAR'}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="h-12 rounded-xl font-bold bg-black/20 border-white/30 text-white hover:bg-black/40"
                                onClick={handleDismiss}
                            >
                                <X className="mr-2 h-4 w-4" /> DISPENSAR
                            </Button>
                        </div>
                    </div>

                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                        AÇÃO REQUERIDA IMEDIATAMENTE
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
