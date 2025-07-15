
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TicketStatusOption {
  value: string;
  label: string;
  color: string;
  isClosed: boolean;
}

export function useTicketStatusOptions() {
  return useQuery({
    queryKey: ['ticket-status-options'],
    queryFn: async () => {
      // Obtener estados personalizados activos
      const { data: customStatuses, error } = await supabase
        .from('custom_ticket_statuses')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching custom statuses:', error);
        throw error;
      }

      // Convertir estados personalizados al formato de opciones
      const statusOptions: TicketStatusOption[] = customStatuses?.map(status => ({
        value: status.name.toLowerCase().replace(/\s+/g, '_'),
        label: status.name,
        color: status.color || '#6366f1',
        isClosed: status.is_closed_status
      })) || [];

      return statusOptions;
    },
  });
}
