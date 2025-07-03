
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTicketStatuses } from '@/hooks/useTicketStatuses';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

interface TicketStatusDropdownProps {
  ticketId: string;
  currentStatus: string;
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
  isCustom?: boolean;
  isClosed?: boolean;
}

export function TicketStatusDropdown({ ticketId, currentStatus }: TicketStatusDropdownProps) {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: customStatuses } = useTicketStatuses();

  // Estados por defecto del sistema
  const defaultStatuses: StatusOption[] = [
    { value: 'abierto', label: 'Abierto', color: '#ef4444', isClosed: false },
    { value: 'en_progreso', label: 'En Progreso', color: '#f59e0b', isClosed: false },
    { value: 'pendiente', label: 'Pendiente', color: '#8b5cf6', isClosed: false },
    { value: 'resuelto', label: 'Resuelto', color: '#10b981', isClosed: true },
    { value: 'cerrado', label: 'Cerrado', color: '#6b7280', isClosed: true },
  ];

  // Combinar estados por defecto con estados personalizados
  const allStatuses: StatusOption[] = [
    ...defaultStatuses,
    ...(customStatuses?.map(status => ({
      value: status.name.toLowerCase().replace(/\s+/g, '_'),
      label: status.name,
      color: status.color || '#6366f1',
      isCustom: true,
      isClosed: status.is_closed_status
    })) || [])
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const selectedStatus = allStatuses.find(s => s.value === newStatus);
      const updateData: any = { status: newStatus };
      
      // Si es un estado de cierre o resuelto, marcar como resuelto
      if (newStatus === 'resuelto' || newStatus === 'cerrado' || selectedStatus?.isClosed) {
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

  const currentStatusOption = allStatuses.find(option => option.value === currentStatus);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentStatusOption?.color }}
          />
          <span>{currentStatusOption?.label || currentStatus}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {allStatuses.map((option) => (
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
            {option.isCustom && (
              <Badge variant="outline" className="ml-auto text-xs">
                Personalizado
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
