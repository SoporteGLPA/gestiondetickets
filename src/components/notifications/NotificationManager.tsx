
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
            .channel('new-tickets')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'tickets',
              },
              (payload) => {
                console.log('Nuevo ticket creado:', payload);
                showLocalNotification(
                  'Nuevo Ticket Creado',
                  `Ticket #${payload.new.ticket_number}: ${payload.new.title}`,
                  { url: `/tickets/${payload.new.id}` }
                );
              }
            )
            .subscribe((status, err) => {
              if (status === 'CHANNEL_ERROR') {
                console.error('Error subscribing to tickets channel:', err);
              }
            });
        }

        // Escuchar comentarios en tickets del usuario
        commentChannel = supabase
          .channel('ticket-comments')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ticket_comments',
            },
            async (payload) => {
              console.log('Nuevo comentario:', payload);
              
              try {
                // Obtener información del ticket para verificar si es relevante para el usuario
                const { data: ticket } = await supabase
                  .from('tickets')
                  .select('customer_id, ticket_number, title')
                  .eq('id', payload.new.ticket_id)
                  .single();

                if (!ticket) return;

                // Si es un usuario normal, solo notificar si es su ticket y el comentario no es suyo
                if (profile.role === 'user') {
                  if (ticket.customer_id === user.id && payload.new.user_id !== user.id) {
                    showLocalNotification(
                      'Nueva Respuesta',
                      `Respuesta en ticket #${ticket.ticket_number}`,
                      { url: `/tickets/${payload.new.ticket_id}` }
                    );
                  }
                  return;
                }

                // Si es agente/admin, notificar comentarios de usuarios en cualquier ticket
                if (payload.new.user_id !== user.id) {
                  const { data: commenter } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', payload.new.user_id)
                    .single();

                  if (commenter?.role === 'user') {
                    showLocalNotification(
                      'Nuevo Comentario de Usuario',
                      `${commenter.full_name} comentó en ticket #${ticket.ticket_number}`,
                      { url: `/tickets/${payload.new.ticket_id}` }
                    );
                  }
                }
              } catch (error) {
                console.error('Error processing comment:', error);
              }
            }
          )
          .subscribe((status, err) => {
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
