
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = (isExpanded: boolean) => {
    setIsSidebarExpanded(isExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onToggle={handleSidebarToggle} />
      <div className={cn(
        "transition-all duration-300",
        isMobile ? "ml-0" : (isSidebarExpanded ? "ml-64" : "ml-16")
      )}>
        <Header />
        <main className={cn(
          "container mx-auto px-4 py-6",
          isMobile && "pb-20" // Espacio para la navegación móvil
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
