
-- Asegurar que las tablas de archivos adjuntos y enlaces existan y funcionen correctamente
-- Actualizar la tabla de archivos adjuntos para artículos
CREATE TABLE IF NOT EXISTS public.article_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de enlaces para artículos si no existe
CREATE TABLE IF NOT EXISTS public.article_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.article_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_links ENABLE ROW LEVEL SECURITY;

-- Políticas para archivos adjuntos
DROP POLICY IF EXISTS "Users can view article attachments" ON public.article_attachments;
DROP POLICY IF EXISTS "Authors can upload attachments to their articles" ON public.article_attachments;
DROP POLICY IF EXISTS "Authors can delete their article attachments" ON public.article_attachments;

CREATE POLICY "Users can view article attachments" 
  ON public.article_attachments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authors can upload attachments to their articles" 
  ON public.article_attachments 
  FOR INSERT 
  WITH CHECK (
    uploaded_by = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM public.knowledge_articles 
      WHERE id = article_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete their article attachments" 
  ON public.article_attachments 
  FOR DELETE 
  USING (
    uploaded_by = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM public.knowledge_articles 
      WHERE id = article_id AND author_id = auth.uid()
    )
  );

-- Políticas para enlaces
DROP POLICY IF EXISTS "Users can view article links" ON public.article_links;
DROP POLICY IF EXISTS "Authors can add links to their articles" ON public.article_links;
DROP POLICY IF EXISTS "Authors can delete their article links" ON public.article_links;

CREATE POLICY "Users can view article links" 
  ON public.article_links 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authors can add links to their articles" 
  ON public.article_links 
  FOR INSERT 
  WITH CHECK (
    created_by = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM public.knowledge_articles 
      WHERE id = article_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete their article links" 
  ON public.article_links 
  FOR DELETE 
  USING (
    created_by = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM public.knowledge_articles 
      WHERE id = article_id AND author_id = auth.uid()
    )
  );

-- Actualizar políticas de artículos para permitir edición y eliminación
DROP POLICY IF EXISTS "Authors and admins can manage articles" ON public.knowledge_articles;

CREATE POLICY "Authors and admins can manage articles" 
  ON public.knowledge_articles 
  FOR ALL 
  USING (author_id = auth.uid() OR is_admin())
  WITH CHECK (author_id = auth.uid() OR is_admin());
