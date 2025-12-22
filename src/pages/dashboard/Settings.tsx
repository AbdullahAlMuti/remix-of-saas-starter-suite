import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import NotificationSettings from '@/components/dashboard/NotificationSettings';

export default function DashboardSettings() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and notification preferences
        </p>
      </motion.div>

      {/* Notification Settings */}
      <NotificationSettings />
    </div>
  );
}
