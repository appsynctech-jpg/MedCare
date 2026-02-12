import { useEffect } from 'react';
import './PWABadge.css';
import { useRegisterSW } from 'virtual:pwa-register/react';

function PWABadge() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    useEffect(() => {
        if (offlineReady) {
            const timer = setTimeout(() => {
                setOfflineReady(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [offlineReady]);

    return (
        <div className="PWABadge" role="alert" aria-labelledby="toast-desc">
            {(offlineReady || needRefresh) && (
                <div className="PWABadge-toast">
                    <div className="PWABadge-message">
                        <span id="toast-desc">
                            {offlineReady
                                ? 'App pronto para uso offline'
                                : 'Nova versão disponível, clique em recarregar para atualizar.'}
                        </span>
                    </div>
                    <div className="PWABadge-buttons">
                        {needRefresh && (
                            <button className="PWABadge-toast-button" onClick={() => updateServiceWorker(true)}>
                                Recarregar
                            </button>
                        )}
                        <button className="PWABadge-toast-button" onClick={() => close()}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PWABadge;
