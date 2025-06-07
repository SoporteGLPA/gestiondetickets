
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Building, Users, Settings as SettingsIcon, FileText, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const { hasRole } = useAuth();

  if (!hasRole(['admin', 'agent'])) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const settingsOptions = [
    {
      title: 'Departamentos',
      description: 'Gestiona los departamentos y sus categorías',
      icon: Building,
      href: '/settings/departments',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Estados de Ticket',
      description: 'Administra los estados de los tickets',
      icon: FileText,
      href: '/settings/ticket-statuses',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Empresa',
      description: 'Configura la información de la empresa',
      icon: SettingsIcon,
      href: '/settings/company',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Colaboradores',
      description: 'Gestiona las áreas de colaboración',
      icon: Briefcase,
      href: '/settings/collaboration-areas',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-800">
          Configuración
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Administra la configuración del sistema
        </p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        {settingsOptions.map((option) => (
          <Card key={option.href} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${option.bgColor}`}>
                  <option.icon className={`h-5 w-5 ${option.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to={option.href}>
                <Button variant="outline" className="w-full">
                  Configurar
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Settings;
