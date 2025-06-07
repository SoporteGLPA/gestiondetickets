
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight, Building, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDepartments, useCreateDepartment, useDepartmentCategories, useCreateDepartmentCategory } from '@/hooks/useDepartments';
import { Link } from 'react-router-dom';

const departmentSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  color: z.string().min(1, 'El color es requerido'),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;
type CategoryFormData = z.infer<typeof categorySchema>;

const Departments = () => {
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>('');

  const { data: departments } = useDepartments();
  const { data: categories } = useDepartmentCategories(selectedDepartmentId);
  const createDepartmentMutation = useCreateDepartment();
  const createCategoryMutation = useCreateDepartmentCategory();

  const departmentForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', color: '#6366f1' },
  });

  const onSubmitDepartment = async (data: DepartmentFormData) => {
    await createDepartmentMutation.mutateAsync(data);
    departmentForm.reset();
    setShowDepartmentForm(false);
  };

  const onSubmitCategory = async (data: CategoryFormData) => {
    await createCategoryMutation.mutateAsync({
      ...data,
      department_id: selectedDepartmentId,
    });
    categoryForm.reset();
    setShowCategoryForm(false);
  };

  const handleDepartmentClick = (departmentId: string, departmentName: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedDepartmentName(departmentName);
  };

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-800">
            Departamentos
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona los departamentos y sus categorías
          </p>
        </div>
        <Link to="/settings">
          <Button variant="outline">Volver a Configuración</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Departamentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Departamentos
              </CardTitle>
              <Dialog open={showDepartmentForm} onOpenChange={setShowDepartmentForm}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Departamento</DialogTitle>
                  </DialogHeader>
                  <Form {...departmentForm}>
                    <form onSubmit={departmentForm.handleSubmit(onSubmitDepartment)} className="space-y-4">
                      <FormField
                        control={departmentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del departamento" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={departmentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descripción del departamento" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowDepartmentForm(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createDepartmentMutation.isPending}>
                          {createDepartmentMutation.isPending ? 'Creando...' : 'Crear'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {departments?.map((department) => (
              <div
                key={department.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedDepartmentId === department.id ? 'border-emerald-500 bg-emerald-50' : ''
                }`}
                onClick={() => handleDepartmentClick(department.id, department.name)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{department.name}</h3>
                    {department.description && (
                      <p className="text-sm text-muted-foreground">{department.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Categorías */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categorías
                {selectedDepartmentName && (
                  <span className="text-sm text-muted-foreground">- {selectedDepartmentName}</span>
                )}
              </CardTitle>
              {selectedDepartmentId && (
                <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Categoría</DialogTitle>
                    </DialogHeader>
                    <Form {...categoryForm}>
                      <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                        <FormField
                          control={categoryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre de la categoría" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Descripción de la categoría" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    className="w-12 h-10 border rounded cursor-pointer"
                                    {...field}
                                  />
                                  <Input placeholder="#6366f1" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setShowCategoryForm(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={createCategoryMutation.isPending}>
                            {createCategoryMutation.isPending ? 'Creando...' : 'Crear'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDepartmentId ? (
              <p className="text-center text-muted-foreground py-8">
                Selecciona un departamento para ver sus categorías
              </p>
            ) : categories?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay categorías en este departamento
              </p>
            ) : (
              categories?.map((category) => (
                <div key={category.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Departments;
