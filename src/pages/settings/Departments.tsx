import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useDepartments';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Departments = () => {
  const { data: departments } = useDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editedDepartmentName, setEditedDepartmentName] = useState('');

  const handleCreateDepartment = async () => {
    if (newDepartmentName.trim() === '') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre del departamento no puede estar vacío",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({ name: newDepartmentName });
      setNewDepartmentName('');
      setShowCreateForm(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el departamento",
      });
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingDepartmentId(id);
    setEditedDepartmentName(name);
  };

  const handleCancelEdit = () => {
    setEditingDepartmentId(null);
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartmentId || editedDepartmentName.trim() === '') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre del departamento no puede estar vacío",
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: editingDepartmentId, name: editedDepartmentName });
      setEditingDepartmentId(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el departamento",
      });
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el departamento",
      });
    }
  };

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight section-title-black">
            Estados de tickets
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Administra los departamentos de la organización
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/settings">
            <Button variant="outline">Volver a Configuración</Button>
          </Link>
          {(profile?.role === 'admin' || profile?.role === 'agent') && (
            <Button onClick={() => setShowCreateForm(true)}>
              Crear Departamento
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Nuevo Departamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCreateForm ? (
              <div className="space-y-2">
                <Label htmlFor="department-name">Nombre del Departamento</Label>
                <Input
                  id="department-name"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="Nombre del departamento"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateDepartment} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creando...' : 'Crear'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="w-full" onClick={() => setShowCreateForm(true)}>
                Agregar Departamento
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Departamentos Existentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments && departments.length > 0 ? (
              <div className="grid gap-4">
                {departments.map((department) => (
                  <div key={department.id} className="flex items-center justify-between">
                    {editingDepartmentId === department.id ? (
                      <Input
                        value={editedDepartmentName}
                        onChange={(e) => setEditedDepartmentName(e.target.value)}
                        placeholder="Nombre del departamento"
                      />
                    ) : (
                      <span>{department.name}</span>
                    )}

                    <div className="flex gap-2">
                      {editingDepartmentId === department.id ? (
                        <>
                          <Button variant="ghost" onClick={handleCancelEdit}>
                            Cancelar
                          </Button>
                          <Button onClick={handleUpdateDepartment} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="icon" onClick={() => handleStartEdit(department.id, department.name)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará el departamento permanentemente.
                                  ¿Estás seguro de que quieres continuar?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDepartment(department.id)} disabled={deleteMutation.isPending}>
                                  {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay departamentos creados aún.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Departments;
