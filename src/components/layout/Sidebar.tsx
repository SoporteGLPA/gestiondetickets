
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { 
  LayoutDashboard, 
  Ticket, 
  BookOpen, 
  Users, 
  Settings, 
  BarChart3
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'agent', 'user'] },
  { name: 'Tickets', href: '/tickets', icon: Ticket, roles: ['admin', 'agent', 'user'] },
  { name: 'Base de Conocimientos', href: '/knowledge', icon: BookOpen, roles: ['admin', 'agent', 'user'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['admin', 'agent'] },
  { name: 'Reportes', href: '/reports', icon: BarChart3, roles: ['admin', 'agent'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['admin', 'agent'] },
];

interface SidebarProps {
  className?: string;
  onToggle?: (isExpanded: boolean) => void;
}

export function Sidebar({ className, onToggle }: SidebarProps) {
  const { isExpanded, isMobile, handleMouseEnter, handleMouseLeave, toggleSidebar } = useSidebarState();
  const location = useLocation();
  const { profile } = useAuth();
  const { data: companySettings } = useCompanySettings();

  useEffect(() => {
    onToggle?.(isExpanded);
  }, [isExpanded, onToggle]);

  const filteredNavigation = navigation.filter(item => 
    profile?.role ? item.roles.includes(profile.role) : false
  );

  const projectName = companySettings?.project_name || 'SoporteGLPA';
  const logoUrl = companySettings?.logo_url;

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
    <>
      {/* Overlay for mobile when expanded */}
      {isMobile && isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 z-50",
          isExpanded ? "w-64" : "w-16",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b border-sidebar-border">
          {isExpanded ? (
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={`${projectName} Logo`} 
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-sidebar-primary-foreground">
                    {projectName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <h1 className="text-xl font-bold text-sidebar-primary">{projectName}</h1>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={`${projectName} Logo`} 
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-sidebar-primary-foreground">
                    {projectName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
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
                    !isExpanded && "justify-center"
                  )}
                  title={!isExpanded ? item.name : undefined}
                >
                  <item.icon className={cn("h-4 w-4", isExpanded && "mr-3")} />
                  {isExpanded && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Info */}
        {isExpanded && (
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
    </>
  );
}
