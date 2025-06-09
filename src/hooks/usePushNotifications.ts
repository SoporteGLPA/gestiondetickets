
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      initializeServiceWorker();
    }
  }, []);

  const initializeServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('Service Worker registrado:', registration);
      
      // Verificar si ya hay una suscripción
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  };

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const subscribeUser = async () => {
    if (!isSupported || !user) return false;

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        toast({
          variant: "destructive",
          title: "Permisos requeridos",
          description: "Se necesitan permisos de notificación para recibir alertas",
        });
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BGqJIBXJv8L6CG8LNq3EqFKQfxp8Ld0j7V_wV8QK3x4hX9fT_Lz3sR4aQ2kR6P1L3xB2vW5oC8dS7nP9jF4m2A'
        ),
      });

      // Guardar la suscripción en la base de datos usando rpc para evitar problemas de tipos
      const { error } = await supabase.rpc('save_push_subscription', {
        p_user_id: user.id,
        p_subscription: JSON.stringify(pushSubscription),
        p_endpoint: pushSubscription.endpoint,
      });

      if (error) {
        // Si el RPC no existe, usar insert directo (esto se actualizará cuando los tipos se regeneren)
        const { error: insertError } = await (supabase as any)
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: JSON.stringify(pushSubscription),
            endpoint: pushSubscription.endpoint,
          });
        
        if (insertError) throw insertError;
      }

      setSubscription(pushSubscription);
      setIsSubscribed(true);
      
      toast({
        title: "Notificaciones activadas",
        description: "Recibirás notificaciones push sobre tus tickets",
      });

      return true;
    } catch (error) {
      console.error('Error al suscribir usuario:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron activar las notificaciones",
      });
      return false;
    }
  };

  const unsubscribeUser = async () => {
    if (!subscription || !user) return false;

    try {
      await subscription.unsubscribe();
      
      // Eliminar la suscripción de la base de datos
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setSubscription(null);
      setIsSubscribed(false);
      
      toast({
        title: "Notificaciones desactivadas",
        description: "Ya no recibirás notificaciones push",
      });

      return true;
    } catch (error) {
      console.error('Error al desuscribir usuario:', error);
      return false;
    }
  };

  // Función para enviar notificación local (cuando está en la app)
  const showLocalNotification = (title: string, body: string, data?: any) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        data,
      });
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscribeUser,
    unsubscribeUser,
    showLocalNotification,
  };
}

// Función auxiliar para convertir la clave VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
