
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Folder, Tag } from 'lucide-react';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useDepartmentCategories, useCreateDepartmentCategory } from '@/hooks/useDepartments';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Departments = () => {
  const { data: departments } = useDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();
  const createCategoryMutation = useCreateDepartmentCategory();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editedDepartmentName, setEditedDepartmentName] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');

  const { data: departmentCategories } = useDepartmentCategories(selectedDepartmentId || '');

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

  const handleCreateCategory = async () => {
    if (!selectedDepartmentId || newCategoryName.trim() === '') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
      });
      return;
    }

    try {
      await createCategoryMutation.mutateAsync({
        department_id: selectedDepartmentId,
        name: newCategoryName,
        description: newCategoryDescription || undefined,
        color: newCategoryColor,
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#6366f1');
      setShowCategoryDialog(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la categoría",
      });
    }
  };

  const handleManageCategories = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setShowCategoryDialog(true);
  };

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight section-title-black">
            Departamentos
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Administra los departamentos y sus categorías de la organización
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/settings">
            <Button variant="outline">Volver a Configuración</Button>
          </Link>
          {(profile?.role === 'admin' || profile?.role === 'agent') && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Departamento
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Crear Nuevo Departamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Departamentos Existentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments && departments.length > 0 ? (
              <div className="grid gap-4">
                {departments.map((department) => (
                  <div key={department.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      {editingDepartmentId === department.id ? (
                        <Input
                          value={editedDepartmentName}
                          onChange={(e) => setEditedDepartmentName(e.target.value)}
                          placeholder="Nombre del departamento"
                          className="flex-1 mr-2"
                        />
                      ) : (
                        <span className="font-medium">{department.name}</span>
                      )}

                      <div className="flex gap-2">
                        {editingDepartmentId === department.id ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={handleUpdateDepartment} disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleManageCategories(department.id)}
                            >
                              <Tag className="h-4 w-4 mr-1" />
                              Categorías
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleStartEdit(department.id, department.name)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará el departamento y todas sus categorías permanentemente.
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
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay departamentos creados aún.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para gestionar categorías */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Gestionar Categorías - {departments?.find(d => d.id === selectedDepartmentId)?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Formulario para crear nueva categoría */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Crear Nueva Categoría</h4>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="category-name">Nombre</Label>
                  <Input
                    id="category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la categoría"
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Descripción (Opcional)</Label>
                  <Input
                    id="category-description"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Descripción de la categoría"
                  />
                </div>
                <div>
                  <Label htmlFor="category-color">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="category-color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending ? 'Creando...' : 'Crear Categoría'}
                </Button>
              </div>
            </div>

            {/* Lista de categorías existentes */}
            <div>
              <h4 className="font-medium mb-3">Categorías Existentes</h4>
              {departmentCategories && departmentCategories.length > 0 ? (
                <div className="space-y-2">
                  {departmentCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <span className="font-medium">{category.name}</span>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay categorías creadas para este departamento.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
