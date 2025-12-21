import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Key, Globe, Bell, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Snipinal',
    supportEmail: 'support@snipinal.com',
    enableRegistration: true,
    requireEmailVerification: true,
    maxSessionsPerUser: 5,
    enableAutoOrders: true,
    maintenanceMode: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Settings saved successfully');
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure global platform settings
        </p>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">General</h2>
            <p className="text-sm text-muted-foreground">Basic platform configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="siteName" className="text-foreground">Site Name</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail" className="text-foreground">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="bg-secondary/50"
            />
          </div>
        </div>
      </motion.div>

      {/* Authentication Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-green-400 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">Authentication</h2>
            <p className="text-sm text-muted-foreground">User authentication settings</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Enable Registration</Label>
              <p className="text-sm text-muted-foreground">Allow new users to sign up</p>
            </div>
            <Switch
              checked={settings.enableRegistration}
              onCheckedChange={(checked) => setSettings({ ...settings, enableRegistration: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Require Email Verification</Label>
              <p className="text-sm text-muted-foreground">Users must verify email before access</p>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxSessions" className="text-foreground">Max Sessions Per User</Label>
            <Input
              id="maxSessions"
              type="number"
              value={settings.maxSessionsPerUser}
              onChange={(e) => setSettings({ ...settings, maxSessionsPerUser: parseInt(e.target.value) })}
              className="bg-secondary/50 w-32"
            />
          </div>
        </div>
      </motion.div>

      {/* Feature Flags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-cyan-400 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">Features</h2>
            <p className="text-sm text-muted-foreground">Enable or disable platform features</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Enable Auto Orders</Label>
              <p className="text-sm text-muted-foreground">Allow automated order processing</p>
            </div>
            <Switch
              checked={settings.enableAutoOrders}
              onCheckedChange={(checked) => setSettings({ ...settings, enableAutoOrders: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground text-destructive">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Disable access for non-admin users</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <Button
          variant="hero"
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="h-5 w-5" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </motion.div>
    </div>
  );
}
