
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateArticle, useUpdateArticle, CreateArticleInput, UpdateArticleInput, AttachmentFile, ArticleLink } from '@/hooks/useKnowledge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Paperclip, Link as LinkIcon, X, File, Image, FileText } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  summary: z.string().optional(),
  content: z.string().min(1, 'El contenido es requerido'),
  category: z.enum(['email', 'red', 'hardware', 'software', 'seguridad']),
  is_published: z.boolean().default(false),
});

interface ArticleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: any;
  mode: 'create' | 'edit';
}

export function ArticleForm({ open, onOpenChange, article, mode }: ArticleFormProps) {
  const { user } = useAuth();
  const createArticleMutation = useCreateArticle();
  const updateArticleMutation = useUpdateArticle();
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [links, setLinks] = useState<ArticleLink[]>([]);
  const [newLink, setNewLink] = useState({ title: '', url: '', description: '' });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      summary: '',
      content: '',
      category: 'software',
      is_published: false,
    },
  });

  useEffect(() => {
    if (article && mode === 'edit') {
      form.reset({
        title: article.title,
        summary: article.summary || '',
        content: article.content,
        category: article.category,
        is_published: article.is_published,
      });
    }
  }, [article, mode, form]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        file,
        name: file.name,
        size: file.size,
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (newLink.title && newLink.url) {
      setLinks(prev => [...prev, { ...newLink }]);
      setNewLink({ title: '', url: '', description: '' });
    }
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />;
    } else if (['pdf'].includes(ext || '')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    try {
      if (mode === 'create') {
        const articleData: CreateArticleInput = {
          title: values.title,
          content: values.content,
          summary: values.summary,
          category: values.category,
          is_published: values.is_published,
          author_id: user.id,
        };

        await createArticleMutation.mutateAsync({
          article: articleData,
          attachments,
          links,
        });
      } else {
        const updateData: UpdateArticleInput = {
          id: article.id,
          title: values.title,
          content: values.content,
          summary: values.summary,
          category: values.category,
          is_published: values.is_published,
        };

        await updateArticleMutation.mutateAsync(updateData);
      }

      form.reset();
      setAttachments([]);
      setLinks([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting article:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear Nuevo Artículo' : 'Editar Artículo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Crea un nuevo artículo para la base de conocimientos'
              : 'Edita la información del artículo'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título del artículo" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
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
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Breve resumen del artículo"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
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
                      placeholder="Contenido completo del artículo"
                      className="resize-none"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      Archivos Adjuntos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Adjuntar Archivos
                      </Button>
                    </div>

                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(attachment.name)}
                              <div>
                                <span className="text-sm font-medium">{attachment.name}</span>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Enlaces Relacionados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <Input
                        placeholder="Título del enlace"
                        value={newLink.title}
                        onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <Input
                        placeholder="URL"
                        value={newLink.url}
                        onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                      />
                      <Input
                        placeholder="Descripción (opcional)"
                        value={newLink.description}
                        onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <Button type="button" onClick={addLink} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>

                    {links.length > 0 && (
                      <div className="space-y-2">
                        {links.map((link, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <LinkIcon className="h-4 w-4" />
                              <div>
                                <span className="text-sm font-medium">{link.title}</span>
                                <p className="text-xs text-gray-500 break-all">{link.url}</p>
                                {link.description && (
                                  <p className="text-xs text-gray-400">{link.description}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLink(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publicar artículo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El artículo será visible para todos los usuarios
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
              >
                {createArticleMutation.isPending || updateArticleMutation.isPending
                  ? (mode === 'create' ? 'Creando...' : 'Actualizando...') 
                  : (mode === 'create' ? 'Crear Artículo' : 'Actualizar Artículo')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
