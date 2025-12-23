import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { NoticesBanner } from './NoticesBanner';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Listen for sidebar collapse state via custom event
  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent<{ collapsed: boolean }>) => {
      setIsCollapsed(e.detail.collapsed);
    };

    window.addEventListener('sidebar-toggle' as any, handleSidebarToggle);
    return () => window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar onCollapseChange={setIsCollapsed} />
      <main 
        className={cn(
          "min-h-screen transition-[margin] duration-300 ease-in-out",
          isCollapsed ? "ml-20" : "ml-20 md:ml-[280px]"
        )}
      >
        <div className="p-6 lg:p-8">
          <NoticesBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}