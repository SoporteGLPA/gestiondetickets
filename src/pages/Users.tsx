
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Mail, Shield, User } from 'lucide-react';

const users = [
  { id: 1, name: 'Juan Pérez', email: 'juan.perez@empresa.com', role: 'Agente', status: 'Activo', tickets: 12 },
  { id: 2, name: 'María García', email: 'maria.garcia@empresa.com', role: 'Administrador', status: 'Activo', tickets: 8 },
  { id: 3, name: 'Ana Martín', email: 'ana.martin@empresa.com', role: 'Agente', status: 'Activo', tickets: 15 },
  { id: 4, name: 'Carlos Ruiz', email: 'carlos.ruiz@empresa.com', role: 'Usuario', status: 'Inactivo', tickets: 3 },
];

const Users = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant={user.role === 'Administrador' ? 'default' : 'outline'}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
                <Badge variant={user.status === 'Activo' ? 'default' : 'secondary'}>
                  {user.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {user.tickets} tickets
                </div>
                <Button variant="outline" size="sm">Editar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Users;
