
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ArticleCategory = Database['public']['Enums']['article_category'];

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category: ArticleCategory;
  author_id: string;
  is_published: boolean;
  views: number;
  rating: number;
  votes_count: number;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
  };
}

export function useKnowledgeArticles() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['knowledge-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los artículos",
        });
        throw error;
      }

      return data as KnowledgeArticle[];
    },
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (articleData: {
      title: string;
      summary?: string;
      content: string;
      category: ArticleCategory;
      author_id: string;
      is_published?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert([articleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast({
        title: "Artículo creado",
        description: "El artículo ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el artículo",
      });
    },
  });
}

export function useIncrementViews() {
  return useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .update({ views: 1 })
        .eq('id', articleId);

      if (error) throw error;
    },
  });
}
