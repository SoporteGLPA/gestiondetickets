
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
import { useCreateTicket } from '@/hooks/useTickets';
import { useDepartments, useDepartmentCategories } from '@/hooks/useDepartments';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';

const ticketSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  priority: z.enum(['baja', 'media', 'alta']),
  department_id: z.string().min(1, 'El departamento es requerido'),
  category_id: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface CreateTicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketForm({ open, onOpenChange }: CreateTicketFormProps) {
  const { user } = useAuth();
  const createTicketMutation = useCreateTicket();
  const { data: departments } = useDepartments();
  const { data: categories } = useCategories();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const { data: departmentCategories } = useDepartmentCategories(selectedDepartmentId);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'media',
      department_id: '',
      category_id: undefined,
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    if (!user) return;

    // Solo incluir category_id si tiene un valor válido y no es "none"
    const ticketData: any = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      department_id: data.department_id,
      customer_id: user.id,
    };

    // Solo agregar category_id si se seleccionó una categoría válida y no es "none"
    if (data.category_id && data.category_id !== 'none') {
      ticketData.category_id = data.category_id;
    }

    console.log('Creating ticket with data:', ticketData);

    await createTicketMutation.mutateAsync(ticketData);
    form.reset();
    setSelectedDepartmentId('');
    onOpenChange(false);
  };

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    form.setValue('department_id', departmentId);
    form.setValue('category_id', 'none'); // Reset to "none" when department changes
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
                    <Textarea 
                      placeholder="Describa el problema detalladamente" 
                      className="min-h-[100px]"
                      {...field} 
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

            {selectedDepartmentId && departmentCategories && departmentCategories.length > 0 && (
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría del Departamento (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una categoría (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {departmentCategories.map((category) => (
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
            )}

            {/* Fallback to general categories if no department categories */}
            {(!selectedDepartmentId || !departmentCategories || departmentCategories.length === 0) && categories && categories.length > 0 && (
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría General (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una categoría (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {categories.map((category) => (
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
            )}

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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? 'Creando...' : 'Crear Ticket'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
