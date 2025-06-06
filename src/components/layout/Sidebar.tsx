
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Ticket, 
  BookOpen, 
  Users, 
  Settings, 
  HelpCircle,
  BarChart3
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'agent', 'user'] },
  { name: 'Tickets', href: '/tickets', icon: Ticket, roles: ['admin', 'agent', 'user'] },
  { name: 'Base de Conocimientos', href: '/knowledge', icon: BookOpen, roles: ['admin', 'agent', 'user'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['admin', 'agent'] },
  { name: 'Reportes', href: '/reports', icon: BarChart3, roles: ['admin', 'agent'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['admin', 'agent'] },
  { name: 'Ayuda', href: '/help', icon: HelpCircle, roles: ['admin', 'agent', 'user'] },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredNavigation = navigation.filter(item => 
    profile?.role ? item.roles.includes(profile.role) : false
  );

  // Navegación móvil en la parte inferior
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex justify-around items-center py-2 px-1">
          {filteredNavigation.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-colors min-w-0",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="truncate max-w-[60px]">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Sidebar desktop con hover
  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 z-40",
        isHovered ? "w-64" : "w-16",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-sidebar-border">
        {isHovered ? (
          <h1 className="text-xl font-bold text-sidebar-primary">SoporteTech</h1>
        ) : (
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <span className="text-sidebar-primary-foreground text-sm font-bold">ST</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground",
                  !isHovered && "justify-center"
                )}
                title={!isHovered ? item.name : undefined}
              >
                <item.icon className={cn("h-4 w-4", isHovered && "mr-3")} />
                {isHovered && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      {isHovered && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
              <span className="text-sidebar-primary-foreground text-sm font-medium">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Usuario'}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">{profile?.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
