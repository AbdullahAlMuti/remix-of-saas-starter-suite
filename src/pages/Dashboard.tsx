import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Bell, 
  Sparkles, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Zap,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, PLANS } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { cn } from '@/lib/utils';

interface DashboardStats {
  activeListings: number;
  pendingOrders: number;
  unreadAlerts: number;
  creditsRemaining: number;
  totalProfit: number;
  ordersToday: number;
  creditsMax: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { planName, subscribed, currentPlan, checkSubscription } = useSubscription();
  
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    pendingOrders: 0,
    unreadAlerts: 0,
    creditsRemaining: 0,
    totalProfit: 0,
    ordersToday: 0,
    creditsMax: 5,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get plan credits max based on subscription
  const getPlanCredits = useCallback(() => {
    switch (planName) {
      case 'starter': return 50;
      case 'growth': return 200;
      case 'enterprise': return 9999;
      default: return 5;
    }
  }, [planName]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, profile?.credits]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        listingsResult,
        pendingOrdersResult,
        alertsResult,
        recentOrdersResult,
        completedOrdersResult,
        todayOrdersResult,
      ] = await Promise.all([
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('auto_orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'PENDING'),
        supabase
          .from('inventory_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'UNREAD'),
        supabase
          .from('auto_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('auto_orders')
          .select('profit')
          .eq('user_id', user.id)
          .eq('status', 'COMPLETED'),
        supabase
          .from('auto_orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString()),
      ]);

      const totalProfit = completedOrdersResult.data?.reduce(
        (acc, order) => acc + (Number(order.profit) || 0), 0
      ) || 0;

      const maxCredits = getPlanCredits();

      setStats({
        activeListings: listingsResult.count || 0,
        pendingOrders: pendingOrdersResult.count || 0,
        unreadAlerts: alertsResult.count || 0,
        creditsRemaining: profile?.credits || 0,
        totalProfit,
        ordersToday: todayOrdersResult.count || 0,
        creditsMax: maxCredits,
      });

      setRecentOrders(recentOrdersResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'FAILED': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'PENDING': return <Clock className="h-3.5 w-3.5" />;
      case 'IN_PROGRESS': return <TrendingUp className="h-3.5 w-3.5" />;
      case 'FAILED': return <AlertTriangle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const creditsPercent = Math.min((stats.creditsRemaining / stats.creditsMax) * 100, 100);

  // Generate sample sparkline data (in real app, this would come from API)
  const generateSparklineData = useCallback((base: number, volatility: number = 0.2) => {
    return Array.from({ length: 7 }, (_, i) => {
      const trend = i * 0.1;
      const noise = (Math.random() - 0.5) * volatility;
      return Math.max(0, base * (1 + trend + noise));
    });
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your business at a glance
          </p>
        </div>
        
        {/* Plan Badge */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
            subscribed 
              ? "bg-primary/10 text-primary border-primary/20" 
              : "bg-secondary text-muted-foreground border-border"
          )}>
            <Shield className="h-3.5 w-3.5" />
            {currentPlan.displayName} Plan
          </div>
          {!subscribed && (
            <Button 
              size="sm" 
              onClick={() => navigate('/dashboard/subscription')}
              className="h-8 text-xs"
            >
              Upgrade
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid - Enhanced Cards with Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Listings"
          value={stats.activeListings}
          icon={Package}
          variant="accent"
          change={stats.activeListings > 0 ? 12 : undefined}
          sparklineData={stats.activeListings > 0 ? generateSparklineData(stats.activeListings) : undefined}
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={ShoppingCart}
          variant={stats.pendingOrders > 0 ? 'warning' : 'default'}
          subtitle={stats.pendingOrders > 0 ? 'Requires attention' : 'All clear'}
        />
        <StatsCard
          title="Total Profit"
          value={`$${stats.totalProfit.toFixed(2)}`}
          icon={DollarSign}
          variant="success"
          change={stats.totalProfit > 0 ? 8.5 : undefined}
          sparklineData={stats.totalProfit > 0 ? generateSparklineData(stats.totalProfit, 0.3) : undefined}
        />
        <StatsCard
          title="Orders Today"
          value={stats.ordersToday}
          icon={TrendingUp}
          variant={stats.ordersToday > 0 ? 'success' : 'default'}
          subtitle={stats.ordersToday > 0 ? 'Keep it up!' : 'No orders yet'}
          progress={stats.ordersToday > 0 ? Math.min((stats.ordersToday / 10) * 100, 100) : undefined}
          changeLabel={stats.ordersToday > 0 ? `${stats.ordersToday} of 10 daily goal` : undefined}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-base font-medium text-foreground">Recent Orders</h2>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
              View All
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="p-5">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Your recent auto-orders will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
                        getStatusColor(order.status)
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.ebay_sku || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          ASIN: {order.amazon_asin || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      ${Number(order.total_cost || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Credits & Quick Actions */}
        <div className="space-y-4">
          {/* Credits Card */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">AI Credits</p>
                  <p className="text-xs text-muted-foreground">This billing period</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => checkSubscription()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-display font-semibold text-foreground">
                  {stats.creditsRemaining}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {stats.creditsMax === 9999 ? '∞' : stats.creditsMax}
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    creditsPercent > 50 ? "bg-primary" : 
                    creditsPercent > 20 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${creditsPercent}%` }}
                />
              </div>
              
              {stats.creditsRemaining < 10 && planName === 'free' && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  Low credits - upgrade for more
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction icon={Package} label="Add New Listing" />
              <QuickAction icon={Sparkles} label="Generate AI Titles" />
              <QuickAction icon={ShoppingCart} label="Process Orders" />
              <QuickAction 
                icon={Bell} 
                label="View Alerts" 
                badge={stats.unreadAlerts > 0 ? stats.unreadAlerts : undefined} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Action Button
function QuickAction({ 
  icon: Icon, 
  label, 
  badge 
}: { 
  icon: any; 
  label: string; 
  badge?: number;
}) {
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left group">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
          {badge}
        </span>
      )}
    </button>
  );
}