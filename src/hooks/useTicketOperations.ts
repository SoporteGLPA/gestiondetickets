
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface TicketOperation {
  id: string;
  ticket_id: string;
  operation_type: 'merge' | 'transfer' | 'assign';
  target_ticket_id?: string;
  target_user_id?: string;
  performed_by: string;
  notes?: string;
  created_at: string;
}

export function useTicketOperations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: "Ticket eliminado",
        description: "El ticket ha sido eliminado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el ticket",
      });
    },
  });

  const mergeTicketsMutation = useMutation({
    mutationFn: async ({ sourceTicketId, targetTicketId, notes }: {
      sourceTicketId: string;
      targetTicketId: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Registrar la operación
      const { error: operationError } = await supabase
        .from('ticket_operations')
        .insert({
          ticket_id: sourceTicketId,
          operation_type: 'merge',
          target_ticket_id: targetTicketId,
          performed_by: user.id,
          notes,
        });

      if (operationError) throw operationError;

      // Transferir comentarios del ticket origen al destino
      const { error: commentsError } = await supabase
        .from('ticket_comments')
        .update({ ticket_id: targetTicketId })
        .eq('ticket_id', sourceTicketId);

      if (commentsError) throw commentsError;

      // Cerrar el ticket origen
      const { error: closeError } = await supabase
        .from('tickets')
        .update({ 
          status: 'cerrado',
          resolution_notes: `Ticket fusionado con #${targetTicketId}${notes ? `. Notas: ${notes}` : ''}`,
          resolved_at: new Date().toISOString()
        })
        .eq('id', sourceTicketId);

      if (closeError) throw closeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: "Tickets fusionados",
        description: "Los tickets han sido fusionados exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron fusionar los tickets",
      });
    },
  });

  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assigneeId, notes }: {
      ticketId: string;
      assigneeId: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Registrar la operación
      const { error: operationError } = await supabase
        .from('ticket_operations')
        .insert({
          ticket_id: ticketId,
          operation_type: 'assign',
          target_user_id: assigneeId,
          performed_by: user.id,
          notes,
        });

      if (operationError) throw operationError;

      // Asignar el ticket
      const { error: assignError } = await supabase
        .from('tickets')
        .update({ assignee_id: assigneeId })
        .eq('id', ticketId);

      if (assignError) throw assignError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: "Ticket asignado",
        description: "El ticket ha sido asignado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo asignar el ticket",
      });
    },
  });

  const transferTicketMutation = useMutation({
    mutationFn: async ({ ticketId, newAssigneeId, notes }: {
      ticketId: string;
      newAssigneeId: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Registrar la operación
      const { error: operationError } = await supabase
        .from('ticket_operations')
        .insert({
          ticket_id: ticketId,
          operation_type: 'transfer',
          target_user_id: newAssigneeId,
          performed_by: user.id,
          notes,
        });

      if (operationError) throw operationError;

      // Transferir el ticket
      const { error: transferError } = await supabase
        .from('tickets')
        .update({ assignee_id: newAssigneeId })
        .eq('id', ticketId);

      if (transferError) throw transferError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: "Ticket transferido",
        description: "El ticket ha sido transferido exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo transferir el ticket",
      });
    },
  });

  // Obtener agentes disponibles para asignación
  const { data: availableAgents } = useQuery({
    queryKey: ['available-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['agent', 'admin'])
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  return {
    deleteTicketMutation,
    mergeTicketsMutation,
    assignTicketMutation,
    transferTicketMutation,
    availableAgents,
  };
}
