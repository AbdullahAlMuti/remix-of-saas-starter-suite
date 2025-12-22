import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Package,
  ShoppingCart,
  Bell,
  FileText,
  ArrowRight,
  RefreshCw,
  UserPlus,
  Ticket,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalListings: number;
  totalOrders: number;
  pendingOrders: number;
  activeNotices: number;
  usageToday: number;
}

interface DailyStats {
  date: string;
  users: number;
  usage: number;
}

interface RecentUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeNotices: 0,
    usageToday: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (logged in within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', sevenDaysAgo.toISOString());

      // Fetch new users today
      const today = startOfDay(new Date());
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Fetch total listings
      const { count: totalListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      // Fetch total orders
      const { count: totalOrders } = await supabase
        .from('auto_orders')
        .select('*', { count: 'exact', head: true });

      // Fetch pending orders
      const { count: pendingOrders } = await supabase
        .from('auto_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // Fetch usage today
      const { count: usageToday } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Fetch active notices
      const { count: activeNotices } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch recent users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, is_active')
        .order('created_at', { ascending: false })
        .limit(5);

      // Generate daily stats for the chart (last 7 days)
      const dailyData: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startDate = startOfDay(date);
        const endDate = endOfDay(date);

        const { count: dayUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        const { count: dayUsage } = await supabase
          .from('usage_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        dailyData.push({
          date: format(date, 'MMM dd'),
          users: dayUsers || 0,
          usage: dayUsage || 0,
        });
      }

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsersToday || 0,
        totalListings: totalListings || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        activeNotices: activeNotices || 0,
        usageToday: usageToday || 0,
      });

      setDailyStats(dailyData);
      setRecentUsers(users || []);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdminStats();
  };

  const quickActions = [
    { label: 'Manage Users', href: '/admin/users', icon: Users, color: 'from-primary to-purple-500' },
    { label: 'Manage Plans', href: '/admin/plans', icon: DollarSign, color: 'from-emerald-500 to-green-400' },
    { label: 'Manage Coupons', href: '/admin/coupons', icon: Ticket, color: 'from-pink-500 to-rose-400' },
    { label: 'Announcements', href: '/admin/notices', icon: Bell, color: 'from-amber-500 to-orange-400' },
    { label: 'Audit Logs', href: '/admin/audit', icon: FileText, color: 'from-blue-500 to-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and real-time analytics
          </p>
        </motion.div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalUsers}</p>
                  {stats.newUsersToday > 0 && (
                    <p className="text-xs text-emerald-400 mt-1">+{stats.newUsersToday} today</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-400 uppercase tracking-wide">Active (7d)</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.activeUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <Activity className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-400 uppercase tracking-wide">Total Listings</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalListings}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Package className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-400 uppercase tracking-wide">Total Orders</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalOrders}</p>
                  {stats.pendingOrders > 0 && (
                    <p className="text-xs text-amber-400 mt-1">{stats.pendingOrders} pending</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <ShoppingCart className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Signups (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(252, 100%, 65%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(252, 100%, 65%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(252, 20%, 18%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(240, 15%, 8%)', 
                        border: '1px solid hsl(252, 20%, 18%)',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(252, 100%, 65%)" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Usage (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(252, 20%, 18%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(240, 15%, 8%)', 
                        border: '1px solid hsl(252, 20%, 18%)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="usage" fill="hsl(180, 100%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.href} to={action.href}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="flex-1 text-left">{action.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Signups</CardTitle>
              <Link to="/admin/users">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-2">No users yet</p>
                  </div>
                ) : (
                  recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.is_active ? "default" : "secondary"} className={user.is_active ? "bg-emerald-500/20 text-emerald-400" : ""}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(user.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-400">Database</span>
                </div>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-400">Auth</span>
                </div>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-400">API</span>
                </div>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-400">Storage</span>
                </div>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
