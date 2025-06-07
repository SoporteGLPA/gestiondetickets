
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Upload, Image } from 'lucide-react';
import { useCompanySettings, useUpdateCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const Company = () => {
  const { data: settings } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();
  const { toast } = useToast();
  
  const [projectName, setProjectName] = useState(settings?.project_name || '');
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url || '');
  const [authBackgroundUrl, setAuthBackgroundUrl] = useState(settings?.auth_background_url || '');
  const [primaryColor, setPrimaryColor] = useState(settings?.primary_color || '#059669');
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondary_color || '#10b981');

  // Update local state when settings data loads
  useState(() => {
    if (settings) {
      setProjectName(settings.project_name);
      setLogoUrl(settings.logo_url || '');
      setAuthBackgroundUrl(settings.auth_background_url || '');
      setPrimaryColor(settings.primary_color);
      setSecondaryColor(settings.secondary_color);
    }
  });

  const handleSave = async () => {
    const updates = {
      project_name: projectName,
      logo_url: logoUrl || null,
      auth_background_url: authBackgroundUrl || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    };

    await updateMutation.mutateAsync(updates);
  };

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-800">
            Configuración de Empresa
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Configura la información de la empresa
          </p>
        </div>
        <Link to="/settings">
          <Button variant="outline">Volver a Configuración</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nombre del Proyecto</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nombre del proyecto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Diseño y Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Diseño y Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo-url">URL del Logo</Label>
              <div className="flex gap-2">
                <Input
                  id="logo-url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/logo.png"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {logoUrl && (
                <div className="mt-2">
                  <img src={logoUrl} alt="Logo preview" className="h-16 w-auto border rounded" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-background">URL del Fondo de Autenticación</Label>
              <div className="flex gap-2">
                <Input
                  id="auth-background"
                  value={authBackgroundUrl}
                  onChange={(e) => setAuthBackgroundUrl(e.target.value)}
                  placeholder="https://ejemplo.com/fondo.jpg"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {authBackgroundUrl && (
                <div className="mt-2">
                  <img src={authBackgroundUrl} alt="Background preview" className="h-24 w-auto border rounded" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Color Primario</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Input
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#059669"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Color Secundario</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Input
                    id="secondary-color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Company;
