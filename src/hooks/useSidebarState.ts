
import { useState, useEffect } from 'react';

export function useSidebarState() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (!isMobile) {
      setIsExpanded(!isExpanded);
    }
  };

  return {
    isExpanded,
    isMobile,
    toggleSidebar,
    setIsExpanded
  };
}
