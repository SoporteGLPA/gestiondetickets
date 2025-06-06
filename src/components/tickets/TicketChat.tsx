
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, File, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketChatProps {
  ticketId: string;
}

export function TicketChat({ ticketId }: TicketChatProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments with real-time updates
  const { data: comments = [] } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          profiles(full_name, role),
          ticket_comment_attachments(*)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('ticket-comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${ticketId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; is_internal: boolean }) => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: user!.id,
          content: commentData.content,
          is_internal: commentData.is_internal,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (comment) => {
      // Upload attachments if any
      for (const file of attachments) {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
          toast({
            variant: "destructive",
            title: "Error",
            description: `El archivo ${file.name} excede el límite de 4MB`,
          });
          continue;
        }

        // Save attachment metadata to database
        const { error: attachmentError } = await supabase
          .from('ticket_comment_attachments')
          .insert({
            comment_id: comment.id,
            file_name: file.name,
            file_path: `ticket-comments/${comment.id}/${file.name}`,
            file_size: file.size,
            mime_type: file.type,
          });

        if (attachmentError) {
          console.error('Error saving attachment:', attachmentError);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      setMessage('');
      setAttachments([]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;

    try {
      await addCommentMutation.mutateAsync({
        content: message || 'Archivo adjunto',
        is_internal: false,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el mensaje",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const downloadAttachment = (attachment: any) => {
    // In a real implementation, you would get the file from storage
    toast({
      title: "Descarga",
      description: `Descargando ${attachment.file_name}...`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`flex ${comment.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[70%] ${
              comment.user_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {comment.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className={`rounded-lg p-3 ${
                comment.user_id === user?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {comment.profiles?.full_name}
                  </span>
                  {comment.profiles?.role === 'agent' && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                      Agente
                    </span>
                  )}
                  {comment.profiles?.role === 'admin' && (
                    <span className="text-xs bg-red-100 text-red-800 px-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                
                {/* Show attachments */}
                {comment.ticket_comment_attachments && comment.ticket_comment_attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {comment.ticket_comment_attachments.map((attachment: any) => (
                      <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                        <File className="h-4 w-4" />
                        <span className="text-xs truncate flex-1">{attachment.file_name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAttachment(attachment)}
                          className="h-6 w-6 p-1"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs opacity-70 mt-1">
                  {formatDistanceToNow(new Date(comment.created_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button 
              type="submit" 
              size="sm"
              disabled={!message.trim() && attachments.length === 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </form>
    </div>
  );
}
