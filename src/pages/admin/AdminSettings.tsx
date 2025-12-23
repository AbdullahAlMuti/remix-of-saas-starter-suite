import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Key, Globe, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AmazonAPISettings from '@/components/admin/AmazonAPISettings';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'SellerSuit',
    supportEmail: 'support@sellersuit.com',
    enableRegistration: true,
    requireEmailVerification: true,
    maxSessionsPerUser: 5,
    enableAutoOrders: true,
    maintenanceMode: false,
  });

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAdminSettings();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'gemini_api_key')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setGeminiApiKey(data.value || '');
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      toast.error('Failed to load platform settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save Gemini API key
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'gemini_api_key',
          value: geminiApiKey,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure global platform settings and AI integrations
        </p>
      </motion.div>

      {/* AI Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 border-primary/20 bg-primary/5"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">AI Configuration</h2>
            <p className="text-sm text-muted-foreground">Power the Amazon title and description generator</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="geminiApiKey" className="text-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              Gemini API Key
            </Label>
            <Input
              id="geminiApiKey"
              type="password"
              placeholder="Enter your Google Gemini API Key"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="bg-secondary/50 border-primary/20 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              Used by the Chrome extension to automatically generate optimized product titles.
            </p>
          </div>
        </div>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
        </div>
      </motion.div>

      {/* Amazon API Settings */}
      <AmazonAPISettings />

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end sticky bottom-8 pt-4"
      >
        <Button
          variant="hero"
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          className="shadow-xl"
        >
          {isSaving ? (
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </motion.div>
    </div>
  );
}
