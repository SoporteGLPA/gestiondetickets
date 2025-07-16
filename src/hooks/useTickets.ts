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
  due_date?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  profiles_customer: {
    full_name: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  profiles_assignee?: {
    full_name: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  ticket_categories?: {
    name: string;
    color: string;
  };
  departments?: {
    name: string;
    department_categories?: {
      name: string;
      color: string;
    }[];
  };
}

export function useTickets(showClosed: boolean = false) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['tickets', showClosed],
    queryFn: async () => {
      try {
        let query = supabase
          .from('tickets')
          .select(`
            *,
            profiles_customer:profiles!customer_id(full_name, email, first_name, last_name),
            profiles_assignee:profiles!assignee_id(full_name, email, first_name, last_name),
            ticket_categories(name, color),
            departments(
              name,
              department_categories(name, color)
            )
          `);

        if (showClosed) {
          query = query.eq('status', 'cerrado');
        } else {
          query = query.neq('status', 'cerrado');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tickets:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los tickets",
          });
          throw error;
        }

        return data as Ticket[];
      } catch (error) {
        console.error('Error in useTickets:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
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
      attachments?: any[];
    }) => {
      console.log('Creating ticket with data:', ticketData);
      
      // Create clean ticket data
      const cleanTicketData: any = {
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        department_id: ticketData.department_id,
        customer_id: ticketData.customer_id,
        ticket_number: ''
      };

      // Include category_id if exists and is valid UUID
      if (ticketData.category_id && 
          typeof ticketData.category_id === 'string' && 
          ticketData.category_id.trim() !== '' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ticketData.category_id)) {
        
        try {
          const { data: category, error: categoryError } = await supabase
            .from('ticket_categories')
            .select('id')
            .eq('id', ticketData.category_id)
            .maybeSingle();

          if (categoryError) {
            console.error('Error verificando categoría:', categoryError);
            console.warn('No se pudo verificar la categoría, continuando sin categoría');
          } else if (!category) {
            console.warn('Categoría no encontrada, continuando sin categoría:', ticketData.category_id);
          } else {
            cleanTicketData.category_id = ticketData.category_id;
          }
        } catch (error) {
          console.error('Error al verificar la categoría:', error);
          console.warn('Continuando sin categoría debido a un error de verificación');
        }
      }

      console.log('Sending to database:', cleanTicketData);

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([cleanTicketData])
        .select()
        .single();

      if (error) {
        console.error('Database error creating ticket:', error);
        throw error;
      }

      console.log('Ticket created successfully:', ticket);

      // Save attachments if any
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        const attachmentPromises = ticketData.attachments.map(async (file) => {
          const { error: attachmentError } = await supabase
            .from('ticket_attachments')
            .insert({
              ticket_id: ticket.id,
              file_name: file.name,
              file_path: file.path,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: ticketData.customer_id
            });

          if (attachmentError) {
            console.error('Error saving attachment:', attachmentError);
          }
        });

        await Promise.all(attachmentPromises);
      }
      
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: "Ticket creado",
        description: "El ticket ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      console.error('Error creating ticket:', error);
      let errorMessage = "No se pudo crear el ticket";
      
      if (error?.code === '23503') {
        errorMessage = "Error de categoría: La categoría seleccionada no es válida";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
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
