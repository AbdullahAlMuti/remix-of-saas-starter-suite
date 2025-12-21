import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  BarChart3,
  Users,
  CreditCard,
  Megaphone,
  ClipboardList,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Package, label: 'Listings', href: '/dashboard/listings' },
  { icon: ShoppingCart, label: 'Auto Orders', href: '/dashboard/orders' },
  { icon: Bell, label: 'Alerts', href: '/dashboard/alerts' },
  { icon: FileText, label: 'Prompts', href: '/dashboard/prompts' },
  { icon: Sparkles, label: 'AI Credits', href: '/dashboard/credits' },
];

const adminNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Dashboard', href: '/admin', adminOnly: true },
  { icon: Users, label: 'Users', href: '/admin/users', adminOnly: true },
  { icon: CreditCard, label: 'Plans', href: '/admin/plans', adminOnly: true },
  { icon: DollarSign, label: 'Payments', href: '/admin/payments', adminOnly: true },
  { icon: ShieldCheck, label: 'Roles', href: '/admin/roles', adminOnly: true },
  { icon: Megaphone, label: 'Notices', href: '/admin/notices', adminOnly: true },
  { icon: ClipboardList, label: 'Audit Logs', href: '/admin/audit', adminOnly: true },
  { icon: Shield, label: 'Settings', href: '/admin/settings', adminOnly: true },
];

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-50"
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            <span className="text-lg font-display font-bold text-sidebar-foreground">Snipinal</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Main Nav */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Main
            </p>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isCollapsed && 'mx-auto')} />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Admin Nav */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Admin
              </p>
            )}
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isCollapsed && 'mx-auto')} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed && profile && (
          <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-xl bg-sidebar-accent/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <Link
            to="/dashboard/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Settings className={cn('h-5 w-5', isCollapsed && 'mx-auto')} />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </Link>
          
          <button
            onClick={signOut}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              'text-destructive hover:bg-destructive/10'
            )}
          >
            <LogOut className={cn('h-5 w-5', isCollapsed && 'mx-auto')} />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
