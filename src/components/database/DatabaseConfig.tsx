
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Database, Server, Settings } from 'lucide-react';
import { getDatabaseConfig, toggleDatabaseMode, updatePostgresConfig } from '@/config/database';
import { useToast } from '@/hooks/use-toast';

export function DatabaseConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState(getDatabaseConfig());
  const [isLocal, setIsLocal] = useState(config.type === 'postgres');
  const [postgresConfig, setPostgresConfig] = useState(
    config.postgres || {
      host: 'localhost',
      port: 5432,
      database: 'tickets_db',
      username: 'postgres',
      password: 'postgres',
      ssl: false
    }
  );

  const handleSaveConfig = () => {
    try {
      updatePostgresConfig(postgresConfig);
      toggleDatabaseMode(isLocal);
      toast({
        title: "Configuración guardada",
        description: "La configuración de la base de datos ha sido actualizada. La página se recargará.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración",
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'tickets',
          query: {
            action: 'SELECT',
            columns: 'COUNT(*)',
            limit: 1
          },
          config: postgresConfig
        })
      });

      if (response.ok) {
        toast({
          title: "Conexión exitosa",
          description: "La conexión a la base de datos PostgreSQL es válida",
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar a la base de datos PostgreSQL",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Base de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="db-mode">Modo de Base de Datos</Label>
              <div className="text-sm text-muted-foreground">
                {isLocal ? 'PostgreSQL Local' : 'Supabase Cloud'}
              </div>
            </div>
            <Switch
              id="db-mode"
              checked={isLocal}
              onCheckedChange={setIsLocal}
            />
          </div>

          <Separator />

          {isLocal ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Server className="h-5 w-5" />
                Configuración PostgreSQL Local
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-host">Host</Label>
                  <Input
                    id="db-host"
                    value={postgresConfig.host}
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">Puerto</Label>
                  <Input
                    id="db-port"
                    type="number"
                    value={postgresConfig.port}
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
                    placeholder="5432"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-name">Nombre de la Base de Datos</Label>
                <Input
                  id="db-name"
                  value={postgresConfig.database}
                  onChange={(e) => setPostgresConfig(prev => ({ ...prev, database: e.target.value }))}
                  placeholder="tickets_db"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-user">Usuario</Label>
                  <Input
                    id="db-user"
                    value={postgresConfig.username}
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="postgres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-password">Contraseña</Label>
                  <Input
                    id="db-password"
                    type="password"
                    value={postgresConfig.password}
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="postgres"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="db-ssl"
                  checked={postgresConfig.ssl || false}
                  onCheckedChange={(checked) => setPostgresConfig(prev => ({ ...prev, ssl: checked }))}
                />
                <Label htmlFor="db-ssl">Usar SSL</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTestConnection} variant="outline">
                  Probar Conexión
                </Button>
                <Button onClick={handleSaveConfig}>
                  Guardar Configuración
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Database className="h-5 w-5" />
                Configuración Supabase
              </div>
              <div className="text-sm text-muted-foreground">
                Usando configuración de Supabase Cloud por defecto
              </div>
              <Button onClick={handleSaveConfig}>
                Aplicar Configuración
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
