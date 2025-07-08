
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Upload } from 'lucide-react';
import { useCompanySettings, useUpdateCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const Company = () => {
  const { data: settings } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();
  const { toast } = useToast();
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [authBackgroundFile, setAuthBackgroundFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState(settings?.primary_color || '#059669');
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondary_color || '#10b981');
  const [uploading, setUploading] = useState(false);

  // Update local state when settings data loads
  useState(() => {
    if (settings) {
      setPrimaryColor(settings.primary_color || '#059669');
      setSecondaryColor(settings.secondary_color || '#10b981');
    }
  });

  const uploadFile = async (file: File, fileName: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${fileName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo subir el archivo",
      });
      return null;
    }
  };

  const handleSave = async () => {
    setUploading(true);
    
    try {
      let logoUrl = settings?.logo_url;
      let authBackgroundUrl = settings?.auth_background_url;

      // Upload logo if selected
      if (logoFile) {
        const uploadedLogoUrl = await uploadFile(logoFile, 'logo');
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl;
        }
      }

      // Upload auth background if selected
      if (authBackgroundFile) {
        const uploadedBackgroundUrl = await uploadFile(authBackgroundFile, 'auth-background');
        if (uploadedBackgroundUrl) {
          authBackgroundUrl = uploadedBackgroundUrl;
        }
      }

      const updates = {
        logo_url: logoUrl,
        auth_background_url: authBackgroundUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      };

      await updateMutation.mutateAsync(updates);
      
      // Reset file inputs
      setLogoFile(null);
      setAuthBackgroundFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight section-title-black">
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
              <Label htmlFor="logo-file">Logo de la Empresa</Label>
              <div className="flex gap-2">
                <Input
                  id="logo-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" disabled>
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {settings?.logo_url && (
                <div className="mt-2">
                  <img src={settings.logo_url} alt="Logo actual" className="h-16 w-auto border rounded" />
                  <p className="text-sm text-muted-foreground mt-1">Logo actual</p>
                </div>
              )}
              {logoFile && (
                <div className="mt-2">
                  <img 
                    src={URL.createObjectURL(logoFile)} 
                    alt="Vista previa del logo" 
                    className="h-16 w-auto border rounded" 
                  />
                  <p className="text-sm text-muted-foreground mt-1">Vista previa del nuevo logo</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-background-file">Fondo de Autenticación</Label>
              <div className="flex gap-2">
                <Input
                  id="auth-background-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAuthBackgroundFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" disabled>
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {settings?.auth_background_url && (
                <div className="mt-2">
                  <img src={settings.auth_background_url} alt="Fondo actual" className="h-24 w-auto border rounded" />
                  <p className="text-sm text-muted-foreground mt-1">Fondo actual</p>
                </div>
              )}
              {authBackgroundFile && (
                <div className="mt-2">
                  <img 
                    src={URL.createObjectURL(authBackgroundFile)} 
                    alt="Vista previa del fondo" 
                    className="h-24 w-auto border rounded" 
                  />
                  <p className="text-sm text-muted-foreground mt-1">Vista previa del nuevo fondo</p>
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
          <Button onClick={handleSave} disabled={updateMutation.isPending || uploading}>
            {updateMutation.isPending || uploading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Company;
