
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TicketPriority = Database['public']['Enums']['ticket_priority'];
type TicketStatus = Database['public']['Enums']['ticket_status'];

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  customer_id: string;
  assignee_id?: string;
  category_id?: string;
  department_id?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  profiles_customer: {
    full_name: string;
    email: string;
  };
  profiles_assignee?: {
    full_name: string;
    email: string;
  };
  ticket_categories?: {
    name: string;
    color: string;
  };
  departments?: {
    name: string;
  };
  department_categories?: {
    name: string;
    color: string;
  };
}

export function useTickets(showClosed: boolean = false) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['tickets', showClosed],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          profiles_customer:profiles!customer_id(full_name, email),
          profiles_assignee:profiles!assignee_id(full_name, email),
          ticket_categories(name, color),
          departments(name),
          department_categories:department_categories!category_id(name, color)
        `);

      if (showClosed) {
        query = query.eq('status', 'cerrado');
      } else {
        query = query.neq('status', 'cerrado');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los tickets",
        });
        throw error;
      }

      return data as Ticket[];
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ticketData: {
      title: string;
      description: string;
      priority: TicketPriority;
      department_id?: string;
      category_id?: string;
      customer_id: string;
    }) => {
      const insertData = {
        ...ticketData,
        ticket_number: ''
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: "Ticket creado",
        description: "El ticket ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el ticket",
      });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: "Ticket actualizado",
        description: "El ticket ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el ticket",
      });
    },
  });
}
