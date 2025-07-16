
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateTicket } from '@/hooks/useTickets';
import { useDepartments, useDepartmentCategories } from '@/hooks/useDepartments';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { RichTextEditor } from '@/components/forms/RichTextEditor';
import { FileUpload } from '@/components/forms/FileUpload';
import { Paperclip } from 'lucide-react';

const ticketSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  priority: z.enum(['baja', 'media', 'alta']),
  department_id: z.string().min(1, 'El departamento es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface CreateTicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketForm({ open, onOpenChange }: CreateTicketFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createTicketMutation = useCreateTicket();
  const { data: departments } = useDepartments();
  const { data: categories } = useCategories();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const { data: departmentCategories } = useDepartmentCategories(selectedDepartmentId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'media',
      department_id: '',
      category_id: '',
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    if (!user || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Form data before processing:', data);

      // Validar que el departamento existe
      const departmentExists = departments?.some(dept => dept.id === data.department_id);
      if (!departmentExists) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El departamento seleccionado no es válido",
        });
        setIsSubmitting(false);
        return;
      }

      // Construir el objeto del ticket
      const ticketData: any = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        department_id: data.department_id,
        customer_id: user.id,
        category_id: data.category_id,
        attachments: attachedFiles
      };

      console.log('Final ticket data to be sent:', ticketData);

      await createTicketMutation.mutate(ticketData, {
        onSuccess: () => {
          form.reset({
            title: '',
            description: '',
            priority: 'media',
            department_id: '',
            category_id: '',
          });
          setSelectedDepartmentId('');
          setAttachedFiles([]);
          onOpenChange(false);
        },
        onSettled: () => {
          setIsSubmitting(false);
        }
      });
      
    } catch (error) {
      console.error('Error al crear el ticket:', error);
      setIsSubmitting(false);
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    form.setValue('department_id', departmentId);
    // Reset category when department changes
    form.setValue('category_id', '');
  };

  const handleCategoryChange = (categoryId: string) => {
    form.setValue('category_id', categoryId);
  };

  const availableCategories = selectedDepartmentId && departmentCategories && departmentCategories.length > 0 
    ? departmentCategories 
    : categories || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
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
                    <Input placeholder="Ingrese el título del ticket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Describa el problema detalladamente. Puede pegar imágenes directamente aquí."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select onValueChange={handleDepartmentChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={handleCategoryChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione la prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Archivos Adjuntos</label>
              <FileUpload
                files={attachedFiles}
                onFilesChange={setAttachedFiles}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTicketMutation.isPending || isSubmitting}
              >
                {createTicketMutation.isPending || isSubmitting ? 'Creando...' : 'Crear Ticket'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
