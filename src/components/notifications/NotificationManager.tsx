
import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function NotificationManager() {
  const { user, profile } = useAuth();
  const { showLocalNotification } = usePushNotifications();
  const channelsRef = useRef<any[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!user || !profile || isInitialized.current) return;

    const setupRealtime = async () => {
      try {
        // Marcar como inicializado para prevenir múltiples suscripciones
        isInitialized.current = true;

        // Limpiar canales existentes
        await cleanupChannels();

        console.log('Setting up realtime notifications for user:', user.id, 'role:', profile.role);

        // Canal para nuevos tickets (solo agentes y admins)
        if (profile.role === 'admin' || profile.role === 'agent') {
          const ticketChannel = supabase
            .channel(`tickets-${user.id}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'tickets'
              },
              (payload) => {
                console.log('Nuevo ticket detectado:', payload);
                // No notificar tickets propios
                if (payload.new.customer_id !== user.id) {
                  showLocalNotification(
                    'Nuevo Ticket',
                    `Ticket #${payload.new.ticket_number}: ${payload.new.title}`,
                    { url: `/tickets/${payload.new.id}` }
                  );
                }
              }
            )
            .subscribe((status) => {
              console.log('Tickets channel status:', status);
            });

          channelsRef.current.push(ticketChannel);
        }

        // Canal para comentarios en tickets
        const commentsChannel = supabase
          .channel(`comments-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ticket_comments'
            },
            async (payload) => {
              console.log('Nuevo comentario detectado:', payload);
              
              // No notificar comentarios propios
              if (payload.new.user_id === user.id) return;

              try {
                // Obtener información del ticket
                const { data: ticket } = await supabase
                  .from('tickets')
                  .select('customer_id, ticket_number, title, assignee_id')
                  .eq('id', payload.new.ticket_id)
                  .single();

                if (!ticket) return;

                let shouldNotify = false;

                if (profile.role === 'user') {
                  // Usuarios: solo notificar si es su ticket
                  shouldNotify = ticket.customer_id === user.id;
                } else if (profile.role === 'agent') {
                  // Agentes: notificar si están asignados al ticket
                  shouldNotify = ticket.assignee_id === user.id;
                } else if (profile.role === 'admin') {
                  // Admins: notificar todos los comentarios
                  shouldNotify = true;
                }

                if (shouldNotify) {
                  const { data: commenter } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', payload.new.user_id)
                    .single();

                  showLocalNotification(
                    'Nuevo Comentario',
                    `${commenter?.full_name || 'Usuario'} comentó en ticket #${ticket.ticket_number}`,
                    { url: `/tickets/${payload.new.ticket_id}` }
                  );
                }
              } catch (error) {
                console.error('Error procesando notificación de comentario:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log('Comments channel status:', status);
          });

        channelsRef.current.push(commentsChannel);

      } catch (error) {
        console.error('Error configurando realtime:', error);
        isInitialized.current = false;
      }
    };

    const cleanupChannels = async () => {
      for (const channel of channelsRef.current) {
        try {
          await supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removiendo canal:', error);
        }
      }
      channelsRef.current = [];
    };

    setupRealtime();

    return () => {
      cleanupChannels();
      isInitialized.current = false;
    };
  }, [user, profile, showLocalNotification]);

  return null;
}
