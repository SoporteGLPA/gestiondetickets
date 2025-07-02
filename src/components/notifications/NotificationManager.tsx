import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function NotificationManager() {
  const { user, profile } = useAuth();
  const { showLocalNotification } = usePushNotifications();
  const isMounted = useRef(true);
  const ticketChannelRef = useRef<any>(null);
  const commentChannelRef = useRef<any>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user || !profile || isInitialized.current) return;

    const setupRealtime = async () => {
      if (!isMounted.current || isInitialized.current) return;
      
      try {
        // Mark as initialized to prevent multiple subscriptions
        isInitialized.current = true;

        // Clean up existing channels before creating new ones
        if (ticketChannelRef.current) {
          await supabase.removeChannel(ticketChannelRef.current);
          ticketChannelRef.current = null;
        }
        if (commentChannelRef.current) {
          await supabase.removeChannel(commentChannelRef.current);
          commentChannelRef.current = null;
        }

        // Escuchar nuevos tickets (para agentes y admins)
        if (profile.role === 'admin' || profile.role === 'agent') {
          ticketChannelRef.current = supabase
            .channel(`new-tickets-notifications-${user.id}`)
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
        commentChannelRef.current = supabase
          .channel(`ticket-comments-notifications-${user.id}`)
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
        isInitialized.current = false; // Reset on error
      }
    };

    setupRealtime().catch(error => {
      console.error('Error setting up realtime subscriptions:', error);
      isInitialized.current = false; // Reset on error
    });

    return () => {
      const cleanup = async () => {
        try {
          isInitialized.current = false;
          if (ticketChannelRef.current) {
            await supabase.removeChannel(ticketChannelRef.current);
            ticketChannelRef.current = null;
          }
          if (commentChannelRef.current) {
            await supabase.removeChannel(commentChannelRef.current);
            commentChannelRef.current = null;
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