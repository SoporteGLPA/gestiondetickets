
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const { isSupported, isSubscribed, subscribeUser, unsubscribeUser } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Las notificaciones push no están soportadas en este navegador
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones Push
        </CardTitle>
        <CardDescription>
          Configura las notificaciones para recibir alertas sobre tickets y respuestas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications">Notificaciones Push</Label>
            <p className="text-sm text-muted-foreground">
              Recibe notificaciones cuando se crean tickets o hay nuevas respuestas
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={async (checked) => {
              if (checked) {
                await subscribeUser();
              } else {
                await unsubscribeUser();
              }
            }}
          />
        </div>

        {isSubscribed && (
          <div className="rounded-lg bg-green-50 p-3 border border-green-200">
            <p className="text-sm text-green-700">
              ✓ Las notificaciones push están activadas. Recibirás alertas sobre la actividad de tus tickets.
            </p>
          </div>
        )}

        {!isSubscribed && (
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
            <p className="text-sm text-gray-600">
              Activa las notificaciones para recibir alertas instantáneas sobre tickets y respuestas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
