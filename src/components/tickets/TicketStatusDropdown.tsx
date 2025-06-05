
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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

export function TicketStatusDropdown({ ticketId, currentStatus }: TicketStatusDropdownProps) {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusOptions = [
    { value: 'abierto', label: 'Abierto', color: 'destructive' },
    { value: 'en_progreso', label: 'En Progreso', color: 'default' },
    { value: 'pendiente', label: 'Pendiente', color: 'secondary' },
    { value: 'resuelto', label: 'Resuelto', color: 'default' },
    { value: 'cerrado', label: 'Cerrado', color: 'outline' },
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resuelto' || newStatus === 'cerrado') {
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

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus);

  if (!hasRole(['admin', 'agent'])) {
    return (
      <Badge variant={currentStatusOption?.color as any}>
        {currentStatusOption?.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Badge variant={currentStatusOption?.color as any}>
            {currentStatusOption?.label}
          </Badge>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => updateStatusMutation.mutate(option.value)}
            disabled={updateStatusMutation.isPending}
          >
            <Badge variant={option.color as any} className="mr-2">
              {option.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
