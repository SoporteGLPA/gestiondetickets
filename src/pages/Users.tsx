
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Search, Users as UsersIcon, Mail, Shield } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, type User } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { UserImportExport } from '@/components/users/UserImportExport';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

const Users = () => {
  const { data: users, isLoading, isError } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.full_name || '');
      setEmail(selectedUser.email || '');
      setRole(selectedUser.role || 'user');
    }
  }, [selectedUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync({ 
        full_name: name, 
        email, 
        password, 
        role,
        is_active: true
      });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });
      setShowCreateForm(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
      });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateUserMutation.mutateAsync({ 
        id: selectedUser.id, 
        full_name: name, 
        email, 
        role 
      });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });
      setShowEditForm(false);
      setSelectedUser(null);
      setName('');
      setEmail('');
      setRole('user');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUserMutation.mutateAsync(id);
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'agent': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'agent': return 'Agente';
      default: return 'Usuario';
    }
  };

  const filteredUsers = users?.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isError) {
    return <div>Error al cargar los usuarios.</div>;
  }

  return (
    <div className="space-y-6 p-2 md:p-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <UsersIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-800">
              Gestión de usuarios
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Administra los usuarios del sistema
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <UserImportExport />
          {(profile?.role === 'admin' || profile?.role === 'agent') && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          )}
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar usuarios por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Card className="sm:w-auto">
          <CardContent className="flex items-center gap-2 p-3">
            <UsersIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">Total: {users?.length || 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                      {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{user.full_name}</h3>
                    <Badge variant={getRoleColor(user.role)} className="text-xs">
                      {getRoleName(user.role)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {(profile?.role === 'admin' || profile?.role === 'agent') && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditForm(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-emerald-50"
                      >
                        <Edit className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                
                {user.department && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>{user.department}</span>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Creado:</span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>Estado:</span>
                    <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                      {user.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </h3>
            <p className="text-muted-foreground mb-4 text-center">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Crea tu primer usuario para comenzar'
              }
            </p>
            {!searchTerm && (profile?.role === 'admin' || profile?.role === 'agent') && (
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

      {/* Create User Form */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Crear Usuario
            </DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario para el sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ingresa el nombre completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <select 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value as UserRole)} 
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="user">Usuario</option>
                <option value="agent">Agente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Form */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-emerald-600" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              Edita la información del usuario.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo</Label>
              <Input 
                id="edit-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa el nombre completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input 
                id="edit-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <select 
                id="edit-role" 
                value={role} 
                onChange={(e) => setRole(e.target.value as UserRole)} 
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="user">Usuario</option>
                <option value="agent">Agente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Edit className="mr-2 h-4 w-4" />
              Actualizar Usuario
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
