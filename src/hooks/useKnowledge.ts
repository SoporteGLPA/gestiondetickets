
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ArticleCategory = Database['public']['Enums']['article_category'];

export interface Article {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category: ArticleCategory;
  author_id: string;
  is_published: boolean;
  rating?: number;
  votes_count: number;
  views: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface ArticleWithAttachments extends Article {
  attachments?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size?: number;
    mime_type?: string;
  }>;
  links?: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
  }>;
}

export interface CreateArticleInput {
  title: string;
  summary?: string;
  content: string;
  category: ArticleCategory;
  author_id: string;
  is_published: boolean;
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
          profiles:author_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los artículos",
        });
        throw error;
      }

      return data as Article[];
    },
  });
}

export function useArticle(id?: string) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['article', id],
    enabled: !!id,
    queryFn: async () => {
      // Primero, obtenemos el artículo
      const { data: article, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          profiles:author_id(full_name, email)
        `)
        .eq('id', id!)
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el artículo",
        });
        throw error;
      }

      // Luego obtenemos los archivos adjuntos
      const { data: attachments } = await supabase
        .from('article_attachments')
        .select('*')
        .eq('article_id', id!);

      // Y los enlaces
      const { data: links } = await supabase
        .from('article_links')
        .select('*')
        .eq('article_id', id!);

      // Incrementamos el contador de vistas
      await supabase
        .from('knowledge_articles')
        .update({ views: (article.views || 0) + 1 })
        .eq('id', id!);

      return {
        ...article,
        attachments: attachments || [],
        links: links || []
      } as ArticleWithAttachments;
    },
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (articleData: CreateArticleInput) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert(articleData)
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

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast({
        title: "Artículo actualizado",
        description: "El artículo ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el artículo",
      });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast({
        title: "Artículo eliminado",
        description: "El artículo ha sido eliminado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el artículo",
      });
    },
  });
}

export function useArticleAttachments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      articleId, 
      fileName, 
      filePath, 
      fileSize, 
      mimeType, 
      userId 
    }: { 
      articleId: string; 
      fileName: string; 
      filePath: string; 
      fileSize?: number; 
      mimeType?: string; 
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from('article_attachments')
        .insert({
          article_id: articleId,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize,
          mime_type: mimeType,
          uploaded_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article', variables.articleId] });
      toast({
        title: "Archivo adjuntado",
        description: "El archivo ha sido adjuntado exitosamente al artículo",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo adjuntar el archivo",
      });
    },
  });
}

export function useArticleLinks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      articleId, 
      title,
      url,
      description,
      userId 
    }: { 
      articleId: string; 
      title: string;
      url: string;
      description?: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from('article_links')
        .insert({
          article_id: articleId,
          title,
          url,
          description,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article', variables.articleId] });
      toast({
        title: "Enlace agregado",
        description: "El enlace ha sido agregado exitosamente al artículo",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el enlace",
      });
    },
  });
}
