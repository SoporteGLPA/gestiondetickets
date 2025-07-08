
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TicketReportData {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  customer_name: string;
  customer_email: string;
  assignee_name?: string;
  category_name?: string;
  department_name?: string;
}

export interface ReportFilters {
  title?: string;
  department_id?: string;
  category_id?: string;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
}

export function useTicketReports(filters: ReportFilters) {
  return useQuery({
    queryKey: ['ticket-reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          title,
          description,
          priority,
          status,
          created_at,
          updated_at,
          resolved_at,
          profiles_customer:profiles!customer_id(full_name, email),
          profiles_assignee:profiles!assignee_id(full_name, email),
          ticket_categories(name),
          departments(name)
        `);

      // Aplicar filtros
      if (filters.title) {
        query = query.ilike('title', `%${filters.title}%`);
      }
      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar datos para el reporte
      return data?.map(ticket => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        customer_name: ticket.profiles_customer?.full_name || 'N/A',
        customer_email: ticket.profiles_customer?.email || 'N/A',
        assignee_name: ticket.profiles_assignee?.full_name || 'Sin asignar',
        category_name: ticket.ticket_categories?.name || 'Sin categoría',
        department_name: ticket.departments?.name || 'Sin departamento',
      })) as TicketReportData[];
    },
  });
}
