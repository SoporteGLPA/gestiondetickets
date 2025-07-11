
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TicketStatus = Database['public']['Enums']['ticket_status'];
type TicketPriority = Database['public']['Enums']['ticket_priority'];

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
  response_time_hours?: number;
  resolution_time_hours?: number;
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

function calculateResponseTime(createdAt: string, firstCommentAt?: string): number | undefined {
  if (!firstCommentAt) return undefined;
  
  const created = new Date(createdAt);
  const firstComment = new Date(firstCommentAt);
  
  return Math.round((firstComment.getTime() - created.getTime()) / (1000 * 60 * 60 * 100)) / 100;
}

function calculateResolutionTime(createdAt: string, resolvedAt?: string): number | undefined {
  if (!resolvedAt) return undefined;
  
  const created = new Date(createdAt);
  const resolved = new Date(resolvedAt);
  
  return Math.round((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 100)) / 100;
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
        query = query.eq('status', filters.status as TicketStatus);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority as TicketPriority);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data: tickets, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!tickets) return [];

      // Obtener el primer comentario de cada ticket para calcular tiempo de respuesta
      const ticketIds = tickets.map(t => t.id);
      const { data: firstComments, error: commentsError } = await supabase
        .from('ticket_comments')
        .select('ticket_id, created_at')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.warn('Error fetching comments for response time:', commentsError);
      }

      // Crear un mapa de primer comentario por ticket
      const firstCommentMap = new Map();
      firstComments?.forEach(comment => {
        if (!firstCommentMap.has(comment.ticket_id)) {
          firstCommentMap.set(comment.ticket_id, comment.created_at);
        }
      });

      // Transformar datos para el reporte
      return tickets.map(ticket => ({
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
        response_time_hours: calculateResponseTime(ticket.created_at, firstCommentMap.get(ticket.id)),
        resolution_time_hours: calculateResolutionTime(ticket.created_at, ticket.resolved_at),
      })) as TicketReportData[];
    },
  });
}
