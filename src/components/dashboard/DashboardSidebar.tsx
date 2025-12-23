import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Shield,
  LogOut,
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
  Crown,
  Puzzle,
  Calculator,
  PenTool,
  Bell,
  TrendingUp,
  Sun,
  Moon,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import SellerSuitLogo from '@/components/SellerSuitLogo';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  hasSubmenu?: boolean;
}

// Original user navigation items with new design
const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Package, label: 'Listings', href: '/dashboard/listings' },
  { icon: ShoppingCart, label: 'Auto Orders', href: '/dashboard/orders' },
  { icon: Bell, label: 'Alerts', href: '/dashboard/alerts' },
  { icon: FileText, label: 'Prompts', href: '/dashboard/prompts' },
  { icon: Calculator, label: 'Calculator', href: '/dashboard/calculator' },
  { icon: PenTool, label: 'Blog Generator', href: '/dashboard/blog-generator' },
  { icon: FileText, label: 'Blog Posts', href: '/dashboard/blog-posts' },
  { icon: Sparkles, label: 'AI Credits', href: '/dashboard/credits' },
  { icon: Crown, label: 'Subscription', href: '/dashboard/subscription' },
  { icon: Puzzle, label: 'Extension', href: '/dashboard/extension' },
];

// Advanced tools section
const advancedToolsItems: NavItem[] = [
  { icon: TrendingUp, label: '500 Best Selling Items', href: '/dashboard/best-selling' },
  { icon: Flame, label: 'Must Sell Items', href: '/dashboard/must-sell' },
];

// Admin navigation items
const adminNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: CreditCard, label: 'Plans', href: '/admin/plans' },
  { icon: DollarSign, label: 'Payments', href: '/admin/payments' },
  { icon: ShieldCheck, label: 'Roles', href: '/admin/roles' },
  { icon: Megaphone, label: 'Notices', href: '/admin/notices' },
  { icon: Sparkles, label: 'AI Prompts', href: '/admin/prompts' },
  { icon: TrendingUp, label: 'Best Selling Items', href: '/admin/best-selling' },
  { icon: Flame, label: 'Must Sell Items', href: '/admin/must-sell' },
  { icon: ClipboardList, label: 'Audit Logs', href: '/admin/audit' },
  { icon: Shield, label: 'Settings', href: '/admin/settings' },
];

interface DashboardSidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export function DashboardSidebar({ onCollapseChange }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapseChange?.(collapsed);
  };

  const isAdminSection = location.pathname.startsWith('/admin');

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  // Check if item is a hot/flame item
  const isHotItem = (href: string) => {
    return href === '/dashboard/best-selling' || href === '/dashboard/must-sell';
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const isHot = isHotItem(item.href);
    
    return (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
          active
            ? 'bg-primary/10 text-primary border border-primary/20'
            : isHot
            ? 'bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 text-foreground hover:from-orange-500/20 hover:via-red-500/20 hover:to-yellow-500/20 border border-orange-500/20'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        )}
      >
        {/* Flame glow effect for hot items */}
        {isHot && (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/10 to-yellow-500/5 animate-pulse" />
        )}
        
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative z-10',
          active 
            ? 'bg-primary text-primary-foreground' 
            : isHot 
            ? 'bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 text-white shadow-lg shadow-orange-500/30' 
            : 'bg-sidebar-accent/50 text-sidebar-foreground group-hover:bg-sidebar-accent'
        )}>
          <Icon className={cn("h-4 w-4", isHot && "animate-pulse")} />
        </div>
        {!isCollapsed && (
          <>
            <span className={cn(
              'flex-1 text-sm font-medium relative z-10',
              active && 'text-primary',
              isHot && 'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent font-semibold'
            )}>
              {item.label}
            </span>
            {isHot && (
              <span className="relative z-10 px-1.5 py-0.5 text-[10px] font-bold uppercase bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full animate-bounce">
                Hot
              </span>
            )}
            {item.hasSubmenu && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <aside
      data-collapsed={isCollapsed}
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50 shadow-sm",
        isCollapsed ? "w-20" : "w-[260px]"
      )}
    >
      {/* Logo Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {!isCollapsed ? (
            <SellerSuitLogo size="sm" showText={true} />
          ) : (
            <SellerSuitLogo size="sm" showText={false} />
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleCollapse(!isCollapsed)}
          className="h-8 w-8 rounded-full hover:bg-sidebar-accent"
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {isAdminSection && isAdmin ? (
          // Admin Navigation
          <div className="space-y-1">
            {adminNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        ) : (
          // User Navigation
          <div className="space-y-1">
            {/* Main Navigation */}
            {mainNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
            
            {/* Divider */}
            <div className="py-2">
              <div className="border-t border-border/50" />
            </div>
            
            {/* Advanced Tools Section */}
            {!isCollapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Advanced Tools
              </p>
            )}
            {advancedToolsItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
            
            {/* Settings */}
            <div className="py-2">
              <div className="border-t border-border/50" />
            </div>
            <NavItemComponent item={{ icon: Settings, label: 'Settings', href: '/dashboard/settings' }} />
            
            {/* Admin Panel Link */}
            {isAdmin && (
              <>
                <div className="py-2">
                  <div className="border-t border-border/50" />
                </div>
                <NavItemComponent 
                  item={{ icon: Shield, label: 'Admin Panel', href: '/admin' }} 
                />
              </>
            )}
          </div>
        )}
      </nav>

      {/* Footer - Logout & Theme */}
      <div className="p-3 border-t border-border">
        {/* Logout */}
        <button
          onClick={signOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
            'text-sidebar-foreground hover:bg-sidebar-accent/50'
          )}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sidebar-accent/50">
            <LogOut className="h-4 w-4" />
          </div>
          {!isCollapsed && <span className="text-sm font-medium">Log out</span>}
        </button>

        {/* Theme Toggle */}
        {!isCollapsed && (
          <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-sidebar-accent/30">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                theme === 'light' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                theme === 'dark' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
