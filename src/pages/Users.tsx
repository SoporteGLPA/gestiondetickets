import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { UserImportExport } from '@/components/users/UserImportExport';

const Users = () => {
  const { data: users, isLoading, isError } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

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
      await createUserMutation.mutateAsync({ full_name: name, email, password, role });
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
      await updateUserMutation.mutateAsync({ id: selectedUser.id, full_name: name, email, role });
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

  if (isLoading) {
    return <div>Cargando usuarios...</div>;
  }

  if (isError) {
    return <div>Error al cargar los usuarios.</div>;
  }

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight section-title-black">
            Gestión de usuarios
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Administra los usuarios del sistema
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <UserImportExport />
          {(profile?.role === 'admin' || profile?.role === 'agent') && (
            <Button onClick={() => setShowCreateForm(true)}>
              Crear Usuario
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableCaption>Lista de usuarios registrados en el sistema.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.id}</TableCell>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {(profile?.role === 'admin' || profile?.role === 'agent') && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {(profile?.role === 'admin' || profile?.role === 'agent') && (
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              Total de usuarios: {users?.length}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Create User Form */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario para el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="col-span-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                <option value="user">Usuario</option>
                <option value="agent">Agente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <Button onClick={handleCreateUser}>Crear Usuario</Button>
        </DialogContent>
      </Dialog>

      {/* Edit User Form */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Edita la información del usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="col-span-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                <option value="user">Usuario</option>
                <option value="agent">Agente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <Button onClick={handleUpdateUser}>Actualizar Usuario</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
