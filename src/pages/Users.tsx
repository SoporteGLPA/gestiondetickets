
import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Mail, Shield, Building, Trash } from 'lucide-react';
import { CreateUserForm } from '@/components/forms/CreateUserForm';
import { EditUserForm } from '@/components/forms/EditUserForm';
import { UserImportExport } from '@/components/users/UserImportExport';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User as UserType } from '@/hooks/useUsers';

const Users = () => {
  const { hasRole } = useAuth();
  const { data: users, isLoading } = useUsers();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el usuario",
      });
    },
  });

  const handleEdit = (user: UserType) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleDelete = async (user: UserType) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.full_name}?`)) {
      await deleteUserMutation.mutateAsync(user.id);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'agent': return 'secondary';
      case 'user': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'agent': return 'Agente';
      case 'user': return 'Usuario';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-800">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        {hasRole(['admin']) && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <UserImportExport />
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:gap-4">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                    <AvatarFallback>
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base truncate">{user.full_name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.department && (
                        <div className="flex items-center space-x-1">
                          <Building className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getRoleColor(user.role)} className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  {hasRole(['admin']) && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="flex-1 sm:flex-none border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-xs"
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(user)}
                        disabled={deleteUserMutation.isPending}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
            <h3 className="text-base md:text-lg font-semibold mb-2">No hay usuarios</h3>
            <p className="text-muted-foreground mb-4 text-center text-sm md:text-base">
              Crea el primer usuario para comenzar
            </p>
            {hasRole(['admin']) && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Usuario
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CreateUserForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm} 
      />

      <EditUserForm 
        open={showEditForm} 
        onOpenChange={setShowEditForm}
        user={selectedUser}
      />
    </div>
  );
};

export default Users;
