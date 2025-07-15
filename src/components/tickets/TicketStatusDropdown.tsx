
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTicketStatusOptions } from '@/hooks/useTicketStatusOptions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface TicketStatusDropdownProps {
  ticketId: string;
  currentStatus: string;
}

export function TicketStatusDropdown({ ticketId, currentStatus }: TicketStatusDropdownProps) {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: statusOptions } = useTicketStatusOptions();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const selectedStatus = statusOptions?.find(s => s.value === newStatus);
      const updateData: any = { status: newStatus };
      
      // Si es un estado de cierre, marcar como resuelto
      if (selectedStatus?.isClosed) {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-reports'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del ticket ha sido actualizado exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del ticket",
      });
    },
  });

  const currentStatusOption = statusOptions?.find(option => option.value === currentStatus);

  if (!hasRole(['admin', 'agent'])) {
    return (
      <div 
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: currentStatusOption?.color + '20', 
          color: currentStatusOption?.color 
        }}
      >
        {currentStatusOption?.label || currentStatus}
      </div>
    );
  }

  if (!statusOptions || statusOptions.length === 0) {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Sin estados configurados
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentStatusOption?.color || '#6b7280' }}
          />
          <span>{currentStatusOption?.label || currentStatus}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => updateStatusMutation.mutate(option.value)}
            disabled={updateStatusMutation.isPending}
            className="flex items-center gap-2"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: option.color }}
            />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
