
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useCreateUser } from '@/hooks/useUsers';

const userSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'agent', 'user']),
  department: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface CreateUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserForm({ open, onOpenChange }: CreateUserFormProps) {
  const createUserMutation = useCreateUser();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'user',
      department: '',
      phone: '',
      is_active: true,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    // Ensure all required fields are present
    const userData = {
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      department: data.department,
      phone: data.phone,
      is_active: data.is_active,
    };

    await createUserMutation.mutateAsync(userData);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="agent">Agente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Departamento (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Teléfono (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuario Activo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Permitir que el usuario acceda al sistema
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
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
