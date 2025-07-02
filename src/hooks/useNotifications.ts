import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useNotifications() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Get notifications based on user role
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user || !profile) return [];

      let query;

      if (profile.role === 'user') {
        // Users only see notifications when agents/admins respond to their tickets
        query = supabase
          .from('ticket_comments')
          .select(`
            id,
            created_at,
            ticket_id,
            profiles!inner(role),
            tickets!inner(
              ticket_number,
              title,
              customer_id
            )
          `)
          .eq('tickets.customer_id', user.id)
          .in('profiles.role', ['agent', 'admin'])
          .order('created_at', { ascending: false });
      } else {
        // Agents and admins see new tickets and new user responses
        query = supabase
          .from('tickets')
          .select(`
            id,
            ticket_number,
            title,
            created_at,
            status,
            customer_id,
            profiles_customer:profiles!customer_id(full_name)
          `)
          .in('status', ['abierto', 'en_progreso'])
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile,
  });

  // Get viewed notifications
  const { data: viewedNotifications = [] } = useQuery({
    queryKey: ['viewed-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notification_views')
        .select('ticket_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(v => v.ticket_id) || [];
    },
    enabled: !!user,
  });

  // Mark notification as viewed
  const markAsViewed = useMutation({
    mutationFn: async (ticketId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('notification_views')
        .upsert({
          user_id: user.id,
          ticket_id: ticketId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewed-notifications', user?.id] });
    },
  });

  // Filter unread notifications
  const unreadNotifications = notifications.filter(notification => {
    const ticketId = profile?.role === 'user' ? notification.ticket_id : notification.id;
    return !viewedNotifications.includes(ticketId);
  });

  return {
    notifications,
    unreadNotifications,
    markAsViewed,
  };
}