
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export function AuthPage() {
  const { signIn, user, loading } = useAuth();
  const { data: companySettings, isLoading: settingsLoading } = useCompanySettings();
  const [isLoading, setIsLoading] = useState(false);

  console.log('AuthPage render - user:', user, 'loading:', loading);

  // Show loading spinner while checking auth or settings
  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    console.log('User authenticated, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      console.log('Attempting sign in for:', email);
      await signIn(email, password);
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const projectName = companySettings?.project_name || 'SoporteGLPA';
  const logoUrl = companySettings?.logo_url;
  const authBackgroundUrl = companySettings?.auth_background_url;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: authBackgroundUrl ? `url(${authBackgroundUrl})` : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay para mejorar la legibilidad */}
      {authBackgroundUrl && (
        <div className="absolute inset-0 bg-black/20" />
      )}
      
      <Card className="w-full max-w-md shadow-xl border-emerald-200 relative z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${projectName} Logo`} 
                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-600"
              />
            ) : (
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {projectName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-800">{projectName}</CardTitle>
          <CardDescription className="text-emerald-600">
            Sistema de Gestión de Tickets y Soporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-emerald-700">Correo Electrónico</Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                placeholder="usuario@empresa.com"
                required
                className="border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-emerald-700">Contraseña</Label>
              <Input
                id="signin-password"
                name="password"
                type="password"
                required
                className="border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#173529] hover:bg-[#173529]/90 text-white border border-black" 
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
