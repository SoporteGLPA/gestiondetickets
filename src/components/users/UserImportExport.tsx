
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, FileText } from 'lucide-react';
import { useUsers, useCreateUser } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface CSVUser {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
}

export function UserImportExport() {
  const { data: users } = useUsers();
  const createUserMutation = useCreateUser();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const exportUsers = () => {
    if (!users || users.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay usuarios para exportar",
      });
      return;
    }

    const csvHeaders = 'full_name,email,role,department,is_active\n';
    const csvData = users.map(user => 
      `"${user.full_name}","${user.email}","${user.role}","${user.department || ''}","${user.is_active}"`
    ).join('\n');

    const csv = csvHeaders + csvData;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exportación exitosa",
      description: "Los usuarios han sido exportados correctamente",
    });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona un archivo CSV válido",
      });
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Validar headers
      const requiredHeaders = ['full_name', 'email', 'password', 'role'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Faltan las siguientes columnas: ${missingHeaders.join(', ')}`);
      }

      const users: CSVUser[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const user: any = {};
        
        headers.forEach((header, index) => {
          if (header === 'is_active') {
            user[header] = values[index]?.toLowerCase() === 'true';
          } else if (header === 'role') {
            const role = values[index] as UserRole;
            if (!['admin', 'agent', 'user'].includes(role)) {
              throw new Error(`Rol inválido en línea ${i + 1}: ${role}`);
            }
            user[header] = role;
          } else {
            user[header] = values[index] || '';
          }
        });

        // Validaciones
        if (!user.full_name || !user.email || !user.password) {
          throw new Error(`Datos incompletos en línea ${i + 1}`);
        }

        // Establecer valores por defecto
        if (user.is_active === undefined) user.is_active = true;
        if (!user.role) user.role = 'user';

        users.push(user as CSVUser);
      }

      // Importar usuarios uno por uno
      let imported = 0;
      for (const user of users) {
        try {
          await createUserMutation.mutateAsync(user);
          imported++;
        } catch (error) {
          console.error(`Error importando usuario ${user.email}:`, error);
        }
      }

      toast({
        title: "Importación completada",
        description: `Se importaron ${imported} de ${users.length} usuarios`,
      });

      setShowImportDialog(false);
    } catch (error) {
      console.error('Error importing users:', error);
      toast({
        variant: "destructive",
        title: "Error de importación",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={exportUsers}
        className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Usuarios desde CSV</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Formato del archivo CSV
                </CardTitle>
                <CardDescription>
                  El archivo debe contener las siguientes columnas:
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="bg-gray-50 p-3 rounded-md font-mono text-xs">
                  full_name,email,password,role,department,is_active<br/>
                  "Juan Pérez","juan@empresa.com","123456","user","Ventas","true"<br/>
                  "Ana García","ana@empresa.com","123456","agent","Soporte","true"
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p><strong>full_name:</strong> Nombre completo (requerido)</p>
                  <p><strong>email:</strong> Correo electrónico (requerido)</p>
                  <p><strong>password:</strong> Contraseña (requerido)</p>
                  <p><strong>role:</strong> admin, agent, o user (requerido)</p>
                  <p><strong>department:</strong> Departamento (opcional)</p>
                  <p><strong>is_active:</strong> true o false (opcional, por defecto true)</p>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                disabled={isImporting}
                className="mt-1"
              />
            </div>

            {isImporting && (
              <div className="text-center text-sm text-muted-foreground">
                Importando usuarios...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
