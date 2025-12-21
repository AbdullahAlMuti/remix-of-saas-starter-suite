import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { motion } from 'framer-motion';

export function DashboardLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(280);

  // Listen for sidebar collapse/expand
  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth);
      }
    };

    // Check every 100ms for sidebar width changes
    const interval = setInterval(handleResize, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
