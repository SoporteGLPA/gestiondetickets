
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Ticket, 
  BookOpen, 
  Users, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarState } from '@/hooks/useSidebarState';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'agent', 'user'] },
  { name: 'Tickets', href: '/tickets', icon: Ticket, roles: ['admin', 'agent', 'user'] },
  { name: 'Base de Conocimientos', href: '/knowledge', icon: BookOpen, roles: ['admin', 'agent', 'user'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['admin'] },
  { name: 'Reportes', href: '/reports', icon: BarChart3, roles: ['admin', 'agent'] },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { isCollapsed, setIsCollapsed } = useSidebarState();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldShowExpanded = isMobile ? !isCollapsed : (!isCollapsed || isHovered);

  const filteredNavigation = navigation.filter(item => 
    item.roles.some(role => hasRole([role]))
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-card border-r transition-all duration-300 flex flex-col",
          shouldShowExpanded ? "w-64" : "w-16",
          isMobile && isCollapsed && "-translate-x-full"
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center space-x-3",
              !shouldShowExpanded && "justify-center"
            )}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <img 
                  src="/logo.jpg" 
                  alt="Soporte GLPA" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              {shouldShowExpanded && (
                <div>
                  <h1 className="text-lg font-bold text-primary">Soporte GLPA</h1>
                  <p className="text-xs text-muted-foreground">Sistema de Tickets</p>
                </div>
              )}
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(true)}
                className="md:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href));
              
              return (
                <li key={item.name}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-11",
                      !shouldShowExpanded && "justify-center px-2"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {shouldShowExpanded && (
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Toggle button for desktop */}
        {!isMobile && (
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "w-full",
                !shouldShowExpanded && "justify-center px-2"
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              {shouldShowExpanded && (
                <span className="ml-2 text-sm">Contraer</span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      {isMobile && isCollapsed && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setIsCollapsed(false)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
