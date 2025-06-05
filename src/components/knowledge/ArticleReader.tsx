
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
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
