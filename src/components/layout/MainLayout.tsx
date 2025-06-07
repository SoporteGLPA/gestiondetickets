
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function MainLayout() {
  const { isCollapsed } = useSidebarState();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getMainMargin = () => {
    if (isMobile) return 'ml-0';
    return isCollapsed ? 'ml-16' : 'ml-64';
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <Sidebar />
      <div className={cn("transition-all duration-300", getMainMargin())}>
        <Header />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
