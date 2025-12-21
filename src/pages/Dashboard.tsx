import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  activeListings: number;
  pendingOrders: number;
  unreadAlerts: number;
  creditsRemaining: number;
  totalProfit: number;
  ordersToday: number;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    pendingOrders: 0,
    unreadAlerts: 0,
    creditsRemaining: profile?.credits || 0,
    totalProfit: 0,
    ordersToday: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch listings count
      const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Fetch pending orders
      const { count: ordersCount } = await supabase
        .from('auto_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'PENDING');

      // Fetch unread alerts
      const { count: alertsCount } = await supabase
        .from('inventory_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'UNREAD');

      // Fetch recent orders
      const { data: orders } = await supabase
        .from('auto_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate total profit from completed orders
      const { data: completedOrders } = await supabase
        .from('auto_orders')
        .select('profit')
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED');

      const totalProfit = completedOrders?.reduce((acc, order) => acc + (Number(order.profit) || 0), 0) || 0;

      // Orders today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayOrdersCount } = await supabase
        .from('auto_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      setStats({
        activeListings: listingsCount || 0,
        pendingOrders: ordersCount || 0,
        unreadAlerts: alertsCount || 0,
        creditsRemaining: profile?.credits || 0,
        totalProfit,
        ordersToday: todayOrdersCount || 0,
      });

      setRecentOrders(orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-success bg-success/10';
      case 'PENDING':
        return 'text-amazon bg-amazon/10';
      case 'IN_PROGRESS':
        return 'text-ebay bg-ebay/10';
      case 'FAILED':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <TrendingUp className="h-4 w-4" />;
      case 'FAILED':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Seller'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your dropshipping business
          </p>
        </div>
        <Button variant="hero">
          <Sparkles className="h-5 w-5" />
          Upgrade Plan
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Active Listings"
          value={stats.activeListings}
          icon={Package}
          iconColor="from-ebay to-blue-400"
          delay={0}
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders}
          change={stats.pendingOrders > 0 ? 'Needs attention' : 'All clear'}
          changeType={stats.pendingOrders > 0 ? 'negative' : 'positive'}
          icon={ShoppingCart}
          iconColor="from-amazon to-orange-400"
          delay={0.1}
        />
        <StatsCard
          title="Unread Alerts"
          value={stats.unreadAlerts}
          icon={Bell}
          iconColor="from-destructive to-red-400"
          delay={0.2}
        />
        <StatsCard
          title="AI Credits"
          value={stats.creditsRemaining}
          change="This month"
          changeType="neutral"
          icon={Sparkles}
          iconColor="from-primary to-purple-400"
          delay={0.3}
        />
        <StatsCard
          title="Total Profit"
          value={`$${stats.totalProfit.toFixed(2)}`}
          change="+12% from last month"
          changeType="positive"
          icon={DollarSign}
          iconColor="from-success to-green-400"
          delay={0.4}
        />
        <StatsCard
          title="Orders Today"
          value={stats.ordersToday}
          icon={TrendingUp}
          iconColor="from-accent to-cyan-400"
          delay={0.5}
        />
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-semibold text-foreground">Recent Orders</h2>
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your recent auto-orders will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.ebay_sku || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">
                        ASIN: {order.amazon_asin || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      ${Number(order.total_cost || 0).toFixed(2)}
                    </p>
                    <p className={`text-sm ${getStatusColor(order.status)} px-2 py-0.5 rounded-full inline-block`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-display font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Button variant="glass" className="w-full justify-start">
              <Package className="h-5 w-5 mr-3" />
              Add New Listing
            </Button>
            <Button variant="glass" className="w-full justify-start">
              <Sparkles className="h-5 w-5 mr-3" />
              Generate AI Titles
            </Button>
            <Button variant="glass" className="w-full justify-start">
              <ShoppingCart className="h-5 w-5 mr-3" />
              Process Orders
            </Button>
            <Button variant="glass" className="w-full justify-start">
              <Bell className="h-5 w-5 mr-3" />
              View Alerts
            </Button>
          </div>

          {/* Credit Usage */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">AI Credits Used</span>
              <span className="text-sm font-medium text-foreground">
                {50 - stats.creditsRemaining}/50
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${((50 - stats.creditsRemaining) / 50) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
