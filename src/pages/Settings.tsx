
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Tags, 
  Palette, 
  UserCog, 
  Bell,
  Settings as SettingsIcon
} from 'lucide-react';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

const Settings = () => {
  const navigate = useNavigate();

  const settingsCategories = [
    {
      title: 'Empresa',
      description: 'Configuración general de la empresa',
      icon: Building2,
      path: '/settings/company',
      color: 'text-blue-600',
    },
    {
      title: 'Departamentos',
      description: 'Gestionar departamentos y categorías',
      icon: UserCog,
      path: '/settings/departments',
      color: 'text-green-600',
    },
    {
      title: 'Estados de Tickets',
      description: 'Configurar estados y flujos de trabajo',
      icon: Tags,
      path: '/settings/ticket-statuses',
      color: 'text-purple-600',
    },
    {
      title: 'Áreas de Colaboración',
      description: 'Gestionar equipos y colaboradores',
      icon: Users,
      path: '/settings/collaboration-areas',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Gestiona la configuración del sistema y personaliza tu experiencia
        </p>
      </div>

      {/* Configuración de Notificaciones */}
      <NotificationSettings />

      {/* Otras configuraciones */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {settingsCategories.map((category) => (
          <Card key={category.path} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <category.icon className={`h-5 w-5 ${category.color}`} />
                {category.title}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(category.path)}
              >
                Configurar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Settings;
