
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useCreateArticle } from '@/hooks/useKnowledge';
import { useAuth } from '@/hooks/useAuth';

const articleSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  summary: z.string().optional(),
  content: z.string().min(1, 'El contenido es requerido'),
  category: z.enum(['email', 'red', 'hardware', 'software', 'seguridad']),
  is_published: z.boolean(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface CreateArticleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateArticleForm({ open, onOpenChange }: CreateArticleFormProps) {
  const { user } = useAuth();
  const createArticleMutation = useCreateArticle();

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      summary: '',
      content: '',
      category: 'software',
      is_published: false,
    },
  });

  const onSubmit = async (data: ArticleFormData) => {
    if (!user) return;

    // Ensure all required fields are present
    const articleData = {
      title: data.title,
      summary: data.summary,
      content: data.content,
      category: data.category,
      is_published: data.is_published,
      author_id: user.id,
    };

    await createArticleMutation.mutateAsync(articleData);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Artículo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el título del artículo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen</FormLabel>
                  <FormControl>
                    <Input placeholder="Breve resumen del artículo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="seguridad">Seguridad</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Escriba el contenido del artículo" 
                      className="min-h-[200px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publicar</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Hacer visible este artículo para todos los usuarios
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createArticleMutation.isPending}
              >
                {createArticleMutation.isPending ? 'Creando...' : 'Crear Artículo'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
