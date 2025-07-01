import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useOptimizedNavigation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch datos comunes para mejorar navegación
    const prefetchCommonData = async () => {
      try {
        // Prefetch tickets si no están en cache
        if (!queryClient.getQueryData(['tickets', false])) {
          queryClient.prefetchQuery({
            queryKey: ['tickets', false],
            staleTime: 30000, // 30 segundos
          });
        }

        // Prefetch categorías de tickets
        if (!queryClient.getQueryData(['ticket-categories'])) {
          queryClient.prefetchQuery({
            queryKey: ['ticket-categories'],
            staleTime: 300000, // 5 minutos
          });
        }

        // Prefetch departamentos
        if (!queryClient.getQueryData(['departments'])) {
          queryClient.prefetchQuery({
            queryKey: ['departments'],
            staleTime: 300000, // 5 minutos
          });
        }
      } catch (error) {
        console.log('Prefetch error (non-critical):', error);
      }
    };

    // Ejecutar prefetch después de un pequeño delay para no bloquear la UI inicial
    const timer = setTimeout(prefetchCommonData, 100);

    return () => clearTimeout(timer);
  }, [queryClient]);

  // Función para limpiar queries no utilizadas periódicamente
  useEffect(() => {
    const cleanup = () => {
      // Limpiar queries viejas cada 5 minutos
      queryClient.clear();
    };

    const interval = setInterval(cleanup, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [queryClient]);

  return {
    prefetchTickets: () => queryClient.prefetchQuery({ queryKey: ['tickets', false] }),
    prefetchUsers: () => queryClient.prefetchQuery({ queryKey: ['users'] }),
    prefetchKnowledge: () => queryClient.prefetchQuery({ queryKey: ['knowledge-articles'] }),
  };
}