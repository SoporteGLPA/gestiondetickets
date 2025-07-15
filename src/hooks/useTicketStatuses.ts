
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomTicketStatus {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_closed_status: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useTicketStatuses() {
  return useQuery({
    queryKey: ['ticket-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_ticket_statuses')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as CustomTicketStatus[];
    },
  });
}

export function useCreateTicketStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      color?: string;
      is_closed_status?: boolean;
      sort_order?: number;
    }) => {
      // Verificar si ya existe un estado con el mismo nombre
      const { data: existing, error: checkError } = await supabase
        .from('custom_ticket_statuses')
        .select('id')
        .eq('name', data.name)
        .eq('is_active', true)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        throw new Error(`Ya existe un estado con el nombre "${data.name}"`);
      }

      const { data: result, error } = await supabase
        .from('custom_ticket_statuses')
        .insert(data)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Ya existe un estado con el nombre "${data.name}"`);
        }
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
      toast({
        title: "Estado creado",
        description: "El estado de ticket ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      console.error('Error creating ticket status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el estado de ticket",
      });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
      if (updates.name) {
        const { data: existing, error: checkError } = await supabase
          .from('custom_ticket_statuses')
          .select('id')
          .eq('name', updates.name)
          .eq('is_active', true)
          .neq('id', id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existing) {
          throw new Error(`Ya existe un estado con el nombre "${updates.name}"`);
        }
      }

      const { data, error } = await supabase
        .from('custom_ticket_statuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Ya existe un estado con el nombre "${updates.name}"`);
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de ticket ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      console.error('Error updating ticket status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado de ticket",
      });
    },
  });
}
