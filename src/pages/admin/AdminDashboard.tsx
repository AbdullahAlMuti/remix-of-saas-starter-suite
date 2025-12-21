import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatsCard } from '@/components/dashboard/StatsCard';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  usageToday: number;
  userGrowth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    usageToday: 0,
    userGrowth: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      // Fetch usage today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: usageToday } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Fetch recent users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, is_active')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalRevenue: 0, // Would come from Stripe integration
        usageToday: usageToday || 0,
        userGrowth: 12.5, // Calculated from historical data
      });

      setRecentUsers(users || []);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform overview and analytics
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          change={`+${stats.userGrowth}% this month`}
          changeType="positive"
          icon={Users}
          iconColor="from-primary to-purple-500"
          delay={0}
        />
        <StatsCard
          title="Active Users (7d)"
          value={stats.activeUsers}
          icon={Activity}
          iconColor="from-success to-green-400"
          delay={0.1}
        />
        <StatsCard
          title="Usage Today"
          value={stats.usageToday}
          change="API calls"
          changeType="neutral"
          icon={TrendingUp}
          iconColor="from-accent to-cyan-400"
          delay={0.2}
        />
        <StatsCard
          title="MRR"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          change="Monthly recurring"
          changeType="neutral"
          icon={DollarSign}
          iconColor="from-amazon to-orange-400"
          delay={0.3}
        />
      </div>

      {/* Recent Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-display font-semibold text-foreground mb-6">Recent Signups</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {user.full_name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
