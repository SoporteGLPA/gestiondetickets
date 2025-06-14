
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar'; // Fixed import (default export)
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300",
        isMobile ? "ml-0" : "ml-[200px]"
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
