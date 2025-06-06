
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Eye, ThumbsUp, ThumbsDown, Paperclip, ExternalLink, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

export function ArticleReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState<number | null>(null);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      if (!id) throw new Error('No article ID provided');
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('knowledge_articles')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);

      return data;
    },
    enabled: !!id,
  });

  // Get article attachments - Corregido para mostrar adjuntos
  const { data: attachments } = useQuery({
    queryKey: ['article-attachments', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('article_attachments')
        .select('*')
        .eq('article_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('No attachments found or error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!id,
  });

  // Get article links - Corregido para mostrar enlaces
  const { data: links } = useQuery({
    queryKey: ['article-links', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('article_links')
        .select('*')
        .eq('article_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('No links found or error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!id,
  });

  // Get user's existing rating
  useQuery({
    queryKey: ['user-rating', id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;
      
      const { data, error } = await supabase
        .from('article_ratings')
        .select('rating')
        .eq('article_id', id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserRating(data.rating);
      }
      
      return data;
    },
    enabled: !!id && !!user,
  });

  const rateArticleMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!id || !user) throw new Error('Missing article ID or user');

      const { error } = await supabase
        .from('article_ratings')
        .upsert({
          article_id: id,
          user_id: user.id,
          rating: rating,
        });

      if (error) throw error;
    },
    onSuccess: (_, rating) => {
      setUserRating(rating);
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      toast({
        title: "Calificación enviada",
        description: "Gracias por calificar este artículo",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la calificación",
      });
    },
  });

  const getCategoryLabel = (category: string) => {
    const categories = {
      'email': 'Email',
      'red': 'Red',
      'hardware': 'Hardware',
      'software': 'Software',
      'seguridad': 'Seguridad'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'email': 'bg-blue-100 text-blue-800',
      'red': 'bg-green-100 text-green-800',
      'hardware': 'bg-orange-100 text-orange-800',
      'software': 'bg-purple-100 text-purple-800',
      'seguridad': 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadAttachment = (attachment: any) => {
    try {
      // Create download link from base64 data or file path
      const link = document.createElement('a');
      link.href = attachment.file_path;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Descarga iniciada",
        description: `Descargando ${attachment.file_name}...`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo descargar el archivo",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Artículo no encontrado</h1>
          <Button onClick={() => navigate('/knowledge')} className="mt-4">
            Volver a la base de conocimientos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/knowledge')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className={getCategoryColor(article.category)}>
            {getCategoryLabel(article.category)}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{article.views} vistas</span>
          </div>
          {article.rating && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{article.rating} ({article.votes_count} votos)</span>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
        
        {article.summary && (
          <p className="text-lg text-muted-foreground mb-4">{article.summary}</p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Por {article.profiles?.full_name}</span>
          <span>
            {formatDistanceToNow(new Date(article.created_at), { 
              addSuffix: true, 
              locale: es 
            })}
          </span>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }}
          />
        </CardContent>
      </Card>

      {/* Archivos Adjuntos - Ahora se muestran correctamente */}
      {attachments && attachments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Archivos Adjuntos ({attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm font-medium">{attachment.file_name}</span>
                    {attachment.file_size && (
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(attachment.file_size)})
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadAttachment(attachment)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enlaces Relacionados - Ahora se muestran correctamente */}
      {links && links.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Enlaces Relacionados ({links.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{link.title}</h4>
                      {link.description && (
                        <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                      )}
                      <p className="text-xs text-blue-600 mt-1 break-all">{link.url}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Abrir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>¿Te fue útil este artículo?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={userRating === 5 ? "default" : "outline"}
                size="sm"
                onClick={() => rateArticleMutation.mutate(5)}
                disabled={rateArticleMutation.isPending}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Útil
              </Button>
              <Button
                variant={userRating === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => rateArticleMutation.mutate(1)}
                disabled={rateArticleMutation.isPending}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                No útil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
