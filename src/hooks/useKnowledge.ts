
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateArticleInput {
  title: string;
  content: string;
  summary?: string;
  category: 'email' | 'red' | 'hardware' | 'software' | 'seguridad';
  is_published: boolean;
  author_id: string;
}

export interface UpdateArticleInput {
  id: string;
  title?: string;
  content?: string;
  summary?: string;
  category?: 'email' | 'red' | 'hardware' | 'software' | 'seguridad';
  is_published?: boolean;
}

export interface AttachmentFile {
  file: File;
  name: string;
  size: number;
}

export interface ArticleLink {
  title: string;
  url: string;
  description?: string;
}

export function useKnowledgeArticles() {
  return useQuery({
    queryKey: ['knowledge-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useKnowledgeArticle(id: string) {
  return useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      article: CreateArticleInput; 
      attachments: AttachmentFile[]; 
      links: ArticleLink[] 
    }) => {
      const { data: article, error } = await supabase
        .from('knowledge_articles')
        .insert(data.article)
        .select()
        .single();

      if (error) throw error;

      // Subir archivos adjuntos
      for (const attachment of data.attachments) {
        const fileName = `${Date.now()}-${attachment.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-assets')
          .upload(`articles/${fileName}`, attachment.file);

        if (uploadError) throw uploadError;

        const { error: attachmentError } = await supabase
          .from('article_attachments')
          .insert({
            article_id: article.id,
            file_name: attachment.name,
            file_path: uploadData.path,
            file_size: attachment.size,
            mime_type: attachment.file.type,
            uploaded_by: data.article.author_id,
          });

        if (attachmentError) throw attachmentError;
      }

      // Crear enlaces
      for (const link of data.links) {
        const { error: linkError } = await supabase
          .from('article_links')
          .insert({
            article_id: article.id,
            title: link.title,
            url: link.url,
            description: link.description,
            created_by: data.article.author_id,
          });

        if (linkError) throw linkError;
      }

      return article;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast({
        title: 'Artículo creado',
        description: 'El artículo ha sido creado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error creating article:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el artículo',
      });
    },
  });
}

export function useUpdateArticle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateArticleInput) => {
      const { data: article, error } = await supabase
        .from('knowledge_articles')
        .update(data)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return article;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast({
        title: 'Artículo actualizado',
        description: 'El artículo ha sido actualizado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error updating article:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el artículo',
      });
    },
  });
}

export function useDeleteArticle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast({
        title: 'Artículo eliminado',
        description: 'El artículo ha sido eliminado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error deleting article:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el artículo',
      });
    },
  });
}

export function useArticleAttachments(articleId: string) {
  return useQuery({
    queryKey: ['article-attachments', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_attachments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!articleId,
  });
}

export function useArticleLinks(articleId: string) {
  return useQuery({
    queryKey: ['article-links', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_links')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!articleId,
  });
}

export function useMyArticles() {
  return useQuery({
    queryKey: ['my-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('author_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
