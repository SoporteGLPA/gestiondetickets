
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

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
    mutationFn: async (content: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          content,
          user_id: user.id,
          is_internal: false, // Siempre false ya que eliminamos la opción
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
      console.error('Error adding comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el comentario",
      });
    },
  });

  // Configurar realtime para comentarios
  useEffect(() => {
    if (!ticketId || isSubscribedRef.current) return;

    const setupRealtime = () => {
      try {
        // Limpiar canal existente
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        console.log('Setting up realtime for ticket chat:', ticketId);

        // Crear nuevo canal
        const channel = supabase
          .channel(`ticket_chat_${ticketId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ticket_comments',
              filter: `ticket_id=eq.${ticketId}`
            },
            (payload) => {
              console.log('Nuevo comentario en chat:', payload);
              // Invalidar queries para actualizar la lista
              queryClient.invalidateQueries({ 
                queryKey: ['ticket-comments', ticketId]
              });
            }
          )
          .subscribe((status) => {
            console.log(`Chat realtime status: ${status}`);
            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error('Error setting up chat realtime:', error);
      }
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
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

    addCommentMutation.mutate(newComment.trim());
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
