/**
 * Configurações da Aplicação
 */

// A URL base da aplicação
// Em produção, isso deve ser definido na variável de ambiente VITE_BASE_URL
// Em desenvolvimento, ou se não definido, tenta usar window.location.origin
export const APP_BASE_URL = import.meta.env.VITE_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const config = {
    APP_BASE_URL,
};
