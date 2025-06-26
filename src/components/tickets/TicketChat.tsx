
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_internal: boolean;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface TicketChatProps {
  ticketId: string;
}

export function TicketChat({ ticketId }: TicketChatProps) {
  const { user, profile } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const { data: comments, isLoading } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, isInternal }: { content: string; isInternal: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          content,
          user_id: user.id,
          is_internal: isInternal,
        })
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      setNewComment('');
      toast({
        title: "Comentario agregado",
        description: "Tu comentario ha sido agregado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el comentario",
      });
    },
  });

  // Configurar realtime para comentarios
  useEffect(() => {
    if (!ticketId) return;

    let reconnectTimeout: NodeJS.Timeout;

    const setupRealtime = async () => {
      // Limpiar canal existente si existe
      if (channelRef.current) {
        try {
          await supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.error('Error al limpiar el canal anterior:', error);
        } finally {
          channelRef.current = null;
        }
      }

      try {
        // Crear nuevo canal
        const channel = supabase
          .channel(`ticket-comments-${ticketId}-${Date.now()}`)
          .on('system' as any, { event: '*' }, (payload: any) => {
            console.log('Evento del sistema:', payload);
            
            // Manejar eventos de desconexión
            if (payload.event === 'disconnect') {
              console.log('Desconectado del servidor, intentando reconectar...');
              attemptReconnect();
            }
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ticket_comments',
              filter: `ticket_id=eq.${ticketId}`,
            },
            (payload) => {
              console.log('Nuevo comentario recibido:', payload);
              queryClient.invalidateQueries({ 
                queryKey: ['ticket-comments', ticketId],
                refetchType: 'active',
              });
            }
          )
          .subscribe((status, err) => {
            console.log('Estado de la suscripción:', status);
            
            if (status === 'CHANNEL_ERROR') {
              console.error('Error en el canal de comentarios:', err);
              attemptReconnect();
            } else if (status === 'SUBSCRIBED') {
              console.log('Suscripción a comentarios activa');
              reconnectAttempts.current = 0; // Reiniciar contador de reconexiones exitosas
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error('Error al configurar realtime:', error);
        attemptReconnect();
      }
    };

    const attemptReconnect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.warn('Número máximo de intentos de reconexión alcanzado');
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Backoff exponencial con máximo 30s
      console.log(`Reintentando conexión en ${delay}ms (intento ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
      
      reconnectTimeout = setTimeout(() => {
        reconnectAttempts.current += 1;
        setupRealtime();
      }, delay);
    };

    // Verificar periódicamente el estado de la conexión
    const connectionCheckInterval = setInterval(() => {
      if (channelRef.current && channelRef.current.state !== 'joined') {
        console.log('Conexión inactiva, intentando reconectar...');
        attemptReconnect();
      }
    }, 30000); // Verificar cada 30 segundos

    setupRealtime();

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(connectionCheckInterval);
      
      const cleanup = async () => {
        if (channelRef.current) {
          try {
            await supabase.removeChannel(channelRef.current);
          } catch (error) {
            console.error('Error al limpiar el canal:', error);
          } finally {
            channelRef.current = null;
          }
        }
      };
      cleanup();
    };
  }, [ticketId, queryClient]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      content: newComment.trim(),
      isInternal,
    });
  };

  const canSeeInternalComments = profile?.role === 'admin' || profile?.role === 'agent';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const visibleComments = comments?.filter(comment => 
    !comment.is_internal || canSeeInternalComments
  ) || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <MessageCircle className="h-5 w-5" />
          Conversación
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 md:p-6">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96 md:max-h-none">
          {visibleComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay comentarios aún</p>
              <p className="text-sm">Inicia la conversación</p>
            </div>
          ) : (
            visibleComments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-3 ${
                  comment.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {comment.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex flex-col max-w-[80%] ${
                    comment.user_id === user?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {comment.profiles?.full_name || 'Usuario'}
                    </span>
                    {comment.is_internal && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Interno
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      comment.user_id === user?.id
                        ? 'bg-emerald-600 text-white'
                        : comment.is_internal
                        ? 'bg-orange-50 border border-orange-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {comment.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {canSeeInternalComments && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="internal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-emerald-300 focus:ring-emerald-500"
              />
              <label htmlFor="internal" className="text-sm text-muted-foreground">
                Comentario interno (solo visible para agentes y administradores)
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe tu comentario..."
              className="flex-1 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={addCommentMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
