
import { Bell, Search, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { profile, signOut } = useAuth();
  const { notifications, unreadNotifications, markAsViewed } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    const ticketId = profile?.role === 'user' ? notification.ticket_id : notification.id;
    markAsViewed.mutate(ticketId);
    navigate(`/tickets/${ticketId}`);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'agent': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'agent': return 'Agente';
      default: return 'Usuario';
    }
  };

  const getNotificationText = (notification: any) => {
    if (profile?.role === 'user') {
      return `Respuesta en ticket #${notification.tickets?.ticket_number}`;
    } else {
      return `Nuevo ticket: #${notification.ticket_number}`;
    }
  };

  const getNotificationSubtext = (notification: any) => {
    if (profile?.role === 'user') {
      return notification.tickets?.title;
    } else {
      return notification.title;
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar tickets, artículos..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadNotifications.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{getNotificationText(notification)}</p>
                      <p className="text-xs text-muted-foreground">{getNotificationSubtext(notification)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm text-muted-foreground">No hay notificaciones nuevas</p>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{profile?.full_name || 'Usuario'}</span>
                  <Badge variant={getRoleColor(profile?.role || 'user')} className="text-xs">
                    {getRoleName(profile?.role || 'user')}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
