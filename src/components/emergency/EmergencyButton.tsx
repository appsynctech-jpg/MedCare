import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { usePanic } from '@/hooks/usePanic';

export function EmergencyButton() {
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [triggered, setTriggered] = useState(false);
  const { user } = useAuth();
  const { triggerPanic } = usePanic();

  const handleTrigger = async () => {
    setTriggered(true);
    await triggerPanic();
  };

  useEffect(() => {
    if (!open) {
      setCountdown(3);
      setTriggered(false);
      return;
    }
    if (triggered) return;

    if (countdown <= 0) {
      handleTrigger();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, countdown, triggered]);

  return (
    <>
      <Button
        variant="destructive"
        size="icon"
        className="h-10 w-10 rounded-full animate-pulse shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Botão de Emergência"
      >
        <AlertTriangle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm text-center border-destructive">
          <DialogTitle className="sr-only">Emergência</DialogTitle>
          <DialogDescription className="sr-only">
            Confirme o acionamento do botão de pânico ou cancele a contagem regressiva.
          </DialogDescription>
          {!triggered ? (
            <div className="space-y-6 py-4">
              <AlertTriangle className="mx-auto h-16 w-16 text-destructive animate-bounce" />
              <h2 className="text-3xl font-bold text-destructive">🚨 EMERGÊNCIA</h2>
              <div className="text-6xl font-bold text-destructive">{countdown}</div>
              <p className="text-muted-foreground">Alerta será enviado automaticamente</p>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => setOpen(false)}
              >
                <X className="mr-2 h-5 w-5" /> CANCELAR
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold">Ajuda acionada!</h2>
              <p className="text-muted-foreground">Seus contatos de emergência foram notificados.</p>
              <Button className="w-full" onClick={() => setOpen(false)}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
