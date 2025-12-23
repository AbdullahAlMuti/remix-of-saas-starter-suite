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
  TrendingUp,
  Search,
  Target,
  Compass,
  FolderSearch,
  Type,
  Wrench,
  Eye,
  BookOpen,
  Layers,
  Sun,
  Moon,
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

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Main navigation items matching the reference design
const researchItems: NavItem[] = [
  { icon: TrendingUp, label: 'Market Insights', href: '/dashboard' },
  { icon: Search, label: 'Product Research', href: '/dashboard/listings' },
  { icon: Target, label: 'Competitor Research', href: '/dashboard/orders' },
  { icon: Compass, label: 'Product Explorer', href: '/dashboard/alerts' },
  { icon: FolderSearch, label: 'Category Research', href: '/dashboard/best-selling' },
];

const toolsItems: NavItem[] = [
  { icon: Type, label: 'Title Builder', href: '/dashboard/prompts' },
  { icon: Wrench, label: 'Advanced Tools', href: '/dashboard/blog-generator', hasSubmenu: true },
];

const myItemsItems: NavItem[] = [
  { icon: Eye, label: 'My Competitors', href: '/dashboard/competitors' },
  { icon: Package, label: 'My Products', href: '/dashboard/products' },
  { icon: BookOpen, label: 'Tutorials & Training', href: '/dashboard/tutorials', hasSubmenu: true },
];

const utilityItems: NavItem[] = [
  { icon: Calculator, label: 'eBay Fee Calculator', href: '/dashboard/calculator' },
  { icon: Settings, label: 'Quick Settings', href: '/dashboard/settings' },
  { icon: Layers, label: 'Bulk Listing Optimization', href: '/dashboard/blog-posts' },
  { icon: Shield, label: 'Management Panel', href: '/dashboard/extension', hasSubmenu: true },
];

const adminNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: CreditCard, label: 'Plans', href: '/admin/plans' },
  { icon: DollarSign, label: 'Payments', href: '/admin/payments' },
  { icon: ShieldCheck, label: 'Roles', href: '/admin/roles' },
  { icon: Megaphone, label: 'Notices', href: '/admin/notices' },
  { icon: Sparkles, label: 'AI Prompts', href: '/admin/prompts' },
  { icon: ShoppingCart, label: 'Best Selling Items', href: '/admin/best-selling' },
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

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
          active
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent/50 text-sidebar-foreground group-hover:bg-sidebar-accent'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        {!isCollapsed && (
          <>
            <span className={cn('flex-1 text-sm font-medium', active && 'text-primary')}>
              {item.label}
            </span>
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
          // User Navigation - matching reference design
          <div className="space-y-1">
            {/* Research Section */}
            {researchItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
            
            {/* Divider */}
            <div className="py-2">
              <div className="border-t border-border/50" />
            </div>
            
            {/* Tools Section */}
            {toolsItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
            
            {/* Divider */}
            <div className="py-2">
              <div className="border-t border-border/50" />
            </div>
            
            {/* My Items Section */}
            {myItemsItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
            
            {/* Divider */}
            <div className="py-2">
              <div className="border-t border-border/50" />
            </div>
            
            {/* Utility Section */}
            {utilityItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
            
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
