
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Users, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  useCollaborationAreas, 
  useUserCollaborationAreas, 
  useCreateCollaborationArea,
  useAssignUserToArea 
} from '@/hooks/useCollaborationAreas';
import { useUsers } from '@/hooks/useUsers';
import { Link } from 'react-router-dom';

const areaSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

const assignmentSchema = z.object({
  user_id: z.string().min(1, 'El usuario es requerido'),
  area_id: z.string().min(1, 'El área es requerida'),
});

type AreaFormData = z.infer<typeof areaSchema>;
type AssignmentFormData = z.infer<typeof assignmentSchema>;

const CollaborationAreas = () => {
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');

  const { data: areas } = useCollaborationAreas();
  const { data: userAreas } = useUserCollaborationAreas();
  const { data: users } = useUsers();
  const createAreaMutation = useCreateCollaborationArea();
  const assignUserMutation = useAssignUserToArea();

  const areaForm = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: '', description: '' },
  });

  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { user_id: '', area_id: '' },
  });

  const onSubmitArea = async (data: AreaFormData) => {
    await createAreaMutation.mutateAsync(data);
    areaForm.reset();
    setShowAreaForm(false);
  };

  const onSubmitAssignment = async (data: AssignmentFormData) => {
    await assignUserMutation.mutateAsync(data);
    assignmentForm.reset();
    setShowAssignmentForm(false);
  };

  const getAreaUsers = (areaId: string) => {
    return userAreas?.filter(ua => ua.area_id === areaId) || [];
  };

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-800">
            Áreas de Colaboración
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona las áreas de colaboración y asigna usuarios
          </p>
        </div>
        <Link to="/settings">
          <Button variant="outline">Volver a Configuración</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Áreas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Áreas de Colaboración
              </CardTitle>
              <Dialog open={showAreaForm} onOpenChange={setShowAreaForm}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Área
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Área de Colaboración</DialogTitle>
                  </DialogHeader>
                  <Form {...areaForm}>
                    <form onSubmit={areaForm.handleSubmit(onSubmitArea)} className="space-y-4">
                      <FormField
                        control={areaForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del área" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={areaForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descripción del área" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowAreaForm(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createAreaMutation.isPending}>
                          {createAreaMutation.isPending ? 'Creando...' : 'Crear'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {areas?.map((area) => {
              const areaUsers = getAreaUsers(area.id);
              return (
                <div
                  key={area.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedAreaId === area.id ? 'border-emerald-500 bg-emerald-50' : ''
                  }`}
                  onClick={() => setSelectedAreaId(area.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{area.name}</h3>
                      {area.description && (
                        <p className="text-sm text-muted-foreground">{area.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {areaUsers.length} usuario{areaUsers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Asignaciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios Asignados
                {selectedAreaId && areas && (
                  <span className="text-sm text-muted-foreground">
                    - {areas.find(a => a.id === selectedAreaId)?.name}
                  </span>
                )}
              </CardTitle>
              {selectedAreaId && (
                <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Asignar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Asignar Usuario al Área</DialogTitle>
                    </DialogHeader>
                    <Form {...assignmentForm}>
                      <form onSubmit={assignmentForm.handleSubmit(onSubmitAssignment)} className="space-y-4">
                        <FormField
                          control={assignmentForm.control}
                          name="area_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Área</FormLabel>
                              <Select onValueChange={field.onChange} value={selectedAreaId}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un área" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {areas?.map((area) => (
                                    <SelectItem key={area.id} value={area.id}>
                                      {area.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
                          name="user_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usuario</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un usuario" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users?.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.full_name} ({user.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setShowAssignmentForm(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={assignUserMutation.isPending}>
                            {assignUserMutation.isPending ? 'Asignando...' : 'Asignar'}
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
            {!selectedAreaId ? (
              <p className="text-center text-muted-foreground py-8">
                Selecciona un área para ver los usuarios asignados
              </p>
            ) : getAreaUsers(selectedAreaId).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay usuarios asignados a esta área
              </p>
            ) : (
              getAreaUsers(selectedAreaId).map((userArea) => (
                <div key={userArea.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{userArea.profiles.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{userArea.profiles.email}</p>
                    </div>
                    <Badge variant="outline">
                      {new Date(userArea.assigned_at).toLocaleDateString()}
                    </Badge>
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

export default CollaborationAreas;
