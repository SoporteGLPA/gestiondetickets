
import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function NotificationManager() {
  const { user, profile } = useAuth();
  const { showLocalNotification } = usePushNotifications();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    let ticketChannel: any;
    let commentChannel: any;

    const setupRealtime = async () => {
      if (!isMounted.current) return;
      
      try {
        // Escuchar nuevos tickets (para agentes y admins)
        if (profile.role === 'admin' || profile.role === 'agent') {
          ticketChannel = supabase
            .channel('new-tickets-notifications')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'tickets',
              },
              (payload) => {
                console.log('Nuevo ticket creado:', payload);
                if (payload.new.customer_id !== user.id) {
                  showLocalNotification(
                    'Nuevo Ticket Creado',
                    `Ticket #${payload.new.ticket_number}: ${payload.new.title}`,
                    { url: `/tickets/${payload.new.id}` }
                  );
                }
              }
            )
            .subscribe((status, err) => {
              console.log('Tickets notification channel status:', status);
              if (status === 'CHANNEL_ERROR') {
                console.error('Error subscribing to tickets channel:', err);
              }
            });
        }

        // Escuchar comentarios en tickets del usuario
        commentChannel = supabase
          .channel('ticket-comments-notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ticket_comments',
            },
            async (payload) => {
              console.log('Nuevo comentario notificación:', payload);
              
              try {
                // Obtener información del ticket para verificar si es relevante para el usuario
                const { data: ticket } = await supabase
                  .from('tickets')
                  .select('customer_id, ticket_number, title, assignee_id')
                  .eq('id', payload.new.ticket_id)
                  .single();

                if (!ticket) return;

                // No notificar comentarios propios
                if (payload.new.user_id === user.id) return;

                // Si es un usuario normal, solo notificar si es su ticket
                if (profile.role === 'user') {
                  if (ticket.customer_id === user.id) {
                    showLocalNotification(
                      'Nueva Respuesta',
                      `Respuesta en ticket #${ticket.ticket_number}`,
                      { url: `/tickets/${payload.new.ticket_id}` }
                    );
                  }
                  return;
                }

                // Si es agente/admin, notificar comentarios relevantes
                if (profile.role === 'agent' || profile.role === 'admin') {
                  const isAssigned = ticket.assignee_id === user.id;
                  
                  if (isAssigned || profile.role === 'admin') {
                    const { data: commenter } = await supabase
                      .from('profiles')
                      .select('role, full_name')
                      .eq('id', payload.new.user_id)
                      .single();

                    showLocalNotification(
                      'Nuevo Comentario',
                      `${commenter?.full_name || 'Usuario'} comentó en ticket #${ticket.ticket_number}`,
                      { url: `/tickets/${payload.new.ticket_id}` }
                    );
                  }
                }
              } catch (error) {
                console.error('Error processing comment notification:', error);
              }
            }
          )
          .subscribe((status, err) => {
            console.log('Comments notification channel status:', status);
            if (status === 'CHANNEL_ERROR') {
              console.error('Error subscribing to comments channel:', err);
            }
          });
      } catch (error) {
        console.error('Error in setupRealtime:', error);
      }
    };

    setupRealtime().catch(error => {
      console.error('Error setting up realtime subscriptions:', error);
    });

    return () => {
      const cleanup = async () => {
        try {
          if (ticketChannel) {
            await supabase.removeChannel(ticketChannel);
          }
          if (commentChannel) {
            await supabase.removeChannel(commentChannel);
          }
        } catch (error) {
          console.error('Error cleaning up channels:', error);
        }
      };
      cleanup();
    };
  }, [user, profile, showLocalNotification]);

  return null;
}
