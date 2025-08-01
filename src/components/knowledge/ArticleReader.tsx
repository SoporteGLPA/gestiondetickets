import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useKnowledgeArticle, useArticleAttachments, useArticleLinks } from '@/hooks/useKnowledge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Eye, ThumbsUp, ThumbsDown, Paperclip, ExternalLink, Download, File, Image, FileText, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';

export function ArticleReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const { data: article, isLoading } = useKnowledgeArticle(id || '');
  const { data: attachments } = useArticleAttachments(id || '');
  const { data: links } = useArticleLinks(id || '');

  // Generar URLs de imágenes para previsualización
  useEffect(() => {
    if (attachments) {
      const generateImageUrls = async () => {
        const urls: Record<string, string> = {};
        
        for (const attachment of attachments) {
          if (isImageFile(attachment.file_name)) {
            try {
              const { data } = await supabase.storage
                .from('company-assets')
                .createSignedUrl(attachment.file_path, 3600); // 1 hora de validez
              
              if (data?.signedUrl) {
                urls[attachment.id] = data.signedUrl;
              }
            } catch (error) {
              console.error('Error generating signed URL:', error);
            }
          }
        }
        
        setImageUrls(urls);
      };

      generateImageUrls();
    }
  }, [attachments]);

  // Incrementar contador de vistas
  useQuery({
    queryKey: ['increment-views', id],
    queryFn: async () => {
      if (!id || !article) return null;
      
      await supabase
        .from('knowledge_articles')
        .update({ views: (article.views || 0) + 1 })
        .eq('id', id);
      
      return true;
    },
    enabled: !!id && !!article,
  });

  // Obtener calificación del usuario
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
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', id] });
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

  const isImageFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (isImageFile(fileName)) {
      return <Image className="h-4 w-4 text-blue-600" />;
    } else if (['pdf'].includes(ext || '')) {
      return <FileText className="h-4 w-4 text-red-600" />;
    }
    return <File className="h-4 w-4 text-gray-600" />;
  };

  const downloadAttachment = async (attachment: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('company-assets')
        .download(attachment.file_path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Descarga iniciada",
        description: `Descargando ${attachment.file_name}...`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo descargar el archivo",
      });
    }
  };

  const copyLinkToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Enlace copiado",
        description: "El enlace ha sido copiado al portapapeles",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar el enlace",
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
            className="prose prose-sm max-w-none whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }}
          />
        </CardContent>
      </Card>

      {/* Archivos Adjuntos */}
      {attachments && attachments.length > 0 && (
        <Card className="mb-6 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Paperclip className="h-5 w-5" />
              Archivos Adjuntos ({attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-4">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="p-4 bg-gray-50 rounded-lg border">
                  {isImageFile(attachment.file_name) && imageUrls[attachment.id] ? (
                    <div className="mb-4">
                      <img 
                        src={imageUrls[attachment.id]} 
                        alt={attachment.file_name}
                        className="max-w-full max-h-64 object-contain rounded-lg border"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded">
                        {getFileIcon(attachment.file_name)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{attachment.file_name}</span>
                        {attachment.file_size && (
                          <p className="text-xs text-gray-500">
                            Tamaño: {formatFileSize(attachment.file_size)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadAttachment(attachment)}
                      className="hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enlaces Relacionados */}
      {links && links.length > 0 && (
        <Card className="mb-6 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <ExternalLink className="h-5 w-5" />
              Enlaces Relacionados ({links.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-4">
              {links.map((link) => (
                <div key={link.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-green-100 rounded">
                          <ExternalLink className="h-3 w-3 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{link.title}</h4>
                      </div>
                      {link.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{link.description}</p>
                      )}
                      <p className="text-xs text-blue-600 break-all font-mono bg-blue-50 p-1 rounded">
                        {link.url}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyLinkToClipboard(link.url)}
                      className="ml-3 hover:bg-green-50 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
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
