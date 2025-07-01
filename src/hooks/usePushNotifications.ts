
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  // Usar localStorage para persistir el estado de suscripción
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      initializeServiceWorker();
    }
  }, [user]);

  const initializeServiceWorker = async () => {
    try {
      // Verificar si ya hay un service worker registrado
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      let registration;
      if (registrations.length > 0) {
        registration = registrations[0];
        console.log('Service Worker ya registrado:', registration);
      } else {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        console.log('Nuevo Service Worker registrado:', registration);
      }
      
      // Verificar si ya hay una suscripción activa
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Suscripción push existente encontrada');
        setSubscription(existingSubscription);
        
        // Verificar si la suscripción sigue siendo válida
        const isValid = await validateSubscription(existingSubscription);
        if (!isValid) {
          console.log('La suscripción no es válida, eliminando...');
          await existingSubscription.unsubscribe();
          setIsSubscribed(false);
          localStorage.removeItem('pushNotificationsEnabled');
          return;
        }
        
        setIsSubscribed(true);
        localStorage.setItem('pushNotificationsEnabled', 'true');
      } else {
        // Verificar el estado guardado en localStorage
        const savedState = localStorage.getItem('pushNotificationsEnabled');
        if (savedState === 'true') {
          // Si el estado guardado es true pero no hay suscripción, intentar suscribir de nuevo
          console.log('Estado guardado indica suscripción activa, pero no se encontró suscripción. Volviendo a suscribir...');
          await subscribeUser();
        } else {
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  };

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const validateSubscription = async (sub: PushSubscription): Promise<boolean> => {
    try {
      // Verificar si el endpoint responde con un estado 200
      const response = await fetch(sub.endpoint, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error validando suscripción:', error);
      return false;
    }
  };

  const subscribeUser = async () => {
    if (!isSupported || !user) {
      console.error('No soportado o usuario no autenticado');
      return false;
    }

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
      
      // Clave VAPID corregida - esta es una clave de ejemplo válida
      const vapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI5B5YndN9C6DOy2lz-oUlLPdkOuqL2VzKNdkjFkf5tPdRvP8EEq4eGDh8';
      
      // Cancelar cualquier suscripción existente primero
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }

      // Crear nueva suscripción
      let pushSubscription;
      try {
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      } catch (error) {
        console.error('Error al suscribirse al servicio de notificaciones:', error);
        throw new Error('No se pudo suscribir al servicio de notificaciones');
      }

      // Guardar la suscripción en la base de datos usando rpc para evitar problemas de tipos
      const { error } = await (supabase as any).rpc('save_push_subscription', {
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

      // Verificar que la suscripción sea válida
      const isValid = await validateSubscription(pushSubscription);
      
      if (isValid) {
        setSubscription(pushSubscription);
        setIsSubscribed(true);
        localStorage.setItem('pushNotificationsEnabled', 'true');
        
        toast({
          title: "Notificaciones activadas",
          description: "Recibirás notificaciones push sobre tus tickets",
        });
        return true;
      } else {
        await pushSubscription.unsubscribe();
        throw new Error('La suscripción no es válida');
      }
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
    if (!user) return false;
    
    // Obtener la suscripción actual si no se proporciona
    let currentSubscription = subscription;
    if (!currentSubscription) {
      const registration = await navigator.serviceWorker.ready;
      currentSubscription = await registration.pushManager.getSubscription();
    }
    
    if (!currentSubscription) return false;

    try {
      try {
        // Eliminar la suscripción del navegador
        if (currentSubscription) {
          await currentSubscription.unsubscribe();
        }
        
        // Eliminar la suscripción de la base de datos
        const { error } = await (supabase as any)
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);

        if (error) console.error('Error al eliminar suscripción de la base de datos:', error);
        
        // Actualizar el estado local
        setSubscription(null);
        setIsSubscribed(false);
        localStorage.setItem('pushNotificationsEnabled', 'false');
        
        toast({
          title: "Notificaciones desactivadas",
          description: "Ya no recibirás notificaciones push",
        });

        return true;
      } catch (error) {
        console.error('Error durante la desuscripción:', error);
        // Forzar la actualización del estado aunque falle la desuscripción
        setSubscription(null);
        setIsSubscribed(false);
        localStorage.setItem('pushNotificationsEnabled', 'false');
        return true;
      }
    } catch (error) {
      console.error('Error al desuscribir usuario:', error);
      return false;
    }
  };

  // Función para enviar notificación local (cuando está en la app)
  const showLocalNotification = async (title: string, body: string, data?: any) => {
    if (Notification.permission !== 'granted') return;

    // Usar Service Worker para mostrar notificaciones cuando sea posible
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          data,
          tag: 'ticket-notification'
        });
        return;
      } catch (error) {
        console.error('Error mostrando notificación con Service Worker:', error);
      }
    }
    
    // Fallback a notificaciones estándar si falla el Service Worker
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        data
      });
    } catch (error) {
      console.error('Error mostrando notificación estándar:', error);
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
