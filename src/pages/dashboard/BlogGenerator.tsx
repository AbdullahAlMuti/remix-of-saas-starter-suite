import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Wifi, 
  Settings2, 
  Plus, 
  Trash2, 
  ExternalLink,
  Check,
  Globe,
  Rss,
  ShoppingBag,
  Webhook,
  PenTool,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface PublishingDestination {
  id: string;
  destination_type: string;
  name: string;
  site_url: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

interface BlogSettings {
  id?: string;
  auto_generate_enabled: boolean;
  auto_publish_enabled: boolean;
  default_destination_id: string | null;
  content_style: string;
  include_pros_cons: boolean;
  include_specifications: boolean;
  include_price_history: boolean;
  affiliate_tag: string;
  custom_prompt: string;
}

const DESTINATION_ICONS: Record<string, typeof Globe> = {
  wordpress: Globe,
  blogger: Rss,
  shopify: ShoppingBag,
  webhook: Webhook,
};

const DESTINATION_LABELS: Record<string, string> = {
  wordpress: "WordPress",
  blogger: "Blogger",
  shopify: "Shopify",
  webhook: "Webhook",
};

export default function BlogGenerator() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("destinations");
  const [destinations, setDestinations] = useState<PublishingDestination[]>([]);
  const [settings, setSettings] = useState<BlogSettings>({
    auto_generate_enabled: false,
    auto_publish_enabled: false,
    default_destination_id: null,
    content_style: 'detailed_review',
    include_pros_cons: true,
    include_specifications: true,
    include_price_history: false,
    affiliate_tag: '',
    custom_prompt: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDestination, setShowAddDestination] = useState(false);
  const [selectedDestinationType, setSelectedDestinationType] = useState<string>("wordpress");
  const [newDestination, setNewDestination] = useState({
    name: "",
    site_url: "",
    api_key: "",
    username: "",
    webhook_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchDestinations();
      fetchSettings();
    }
  }, [user]);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from("publishing_destinations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error("Error fetching destinations:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_generation_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          id: data.id,
          auto_generate_enabled: data.auto_generate_enabled,
          auto_publish_enabled: data.auto_publish_enabled,
          default_destination_id: data.default_destination_id,
          content_style: data.content_style,
          include_pros_cons: data.include_pros_cons,
          include_specifications: data.include_specifications,
          include_price_history: data.include_price_history,
          affiliate_tag: data.affiliate_tag || '',
          custom_prompt: data.custom_prompt || '',
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const settingsData = {
        user_id: user.id,
        auto_generate_enabled: settings.auto_generate_enabled,
        auto_publish_enabled: settings.auto_publish_enabled,
        default_destination_id: settings.default_destination_id,
        content_style: settings.content_style,
        include_pros_cons: settings.include_pros_cons,
        include_specifications: settings.include_specifications,
        include_price_history: settings.include_price_history,
        affiliate_tag: settings.affiliate_tag,
        custom_prompt: settings.custom_prompt,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("blog_generation_settings")
          .update(settingsData)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blog_generation_settings")
          .insert(settingsData);
        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Your blog generation settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDestination = async () => {
    if (!user) return;

    try {
      const destinationData: any = {
        user_id: user.id,
        destination_type: selectedDestinationType,
        name: newDestination.name || `${DESTINATION_LABELS[selectedDestinationType]} Site`,
        site_url: newDestination.site_url || null,
        api_key: newDestination.api_key || null,
        username: newDestination.username || null,
        webhook_url: selectedDestinationType === 'webhook' ? newDestination.webhook_url : null,
        is_active: true,
        is_default: destinations.length === 0,
      };

      const { error } = await supabase
        .from("publishing_destinations")
        .insert(destinationData);

      if (error) throw error;

      toast({
        title: "Destination Added",
        description: `${DESTINATION_LABELS[selectedDestinationType]} has been configured.`,
      });

      setNewDestination({ name: "", site_url: "", api_key: "", username: "", webhook_url: "" });
      setShowAddDestination(false);
      fetchDestinations();
    } catch (error) {
      console.error("Error adding destination:", error);
      toast({
        title: "Error",
        description: "Failed to add destination",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDestination = async (id: string) => {
    try {
      const { error } = await supabase
        .from("publishing_destinations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Destination has been removed.",
      });
      fetchDestinations();
    } catch (error) {
      console.error("Error deleting destination:", error);
      toast({
        title: "Error",
        description: "Failed to delete destination",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from("publishing_destinations")
        .update({ is_default: false })
        .neq("id", "placeholder");

      // Then set the new default
      const { error } = await supabase
        .from("publishing_destinations")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Default Updated",
        description: "Default publishing destination has been set.",
      });
      fetchDestinations();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const DestinationCard = ({ type, isSelected }: { type: string; isSelected: boolean }) => {
    const Icon = DESTINATION_ICONS[type] || Globe;
    return (
      <Card 
        className={`cursor-pointer transition-all ${
          isSelected 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setSelectedDestinationType(type)}
      >
        <CardContent className="p-4 flex flex-col items-center gap-2">
          <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
            {DESTINATION_LABELS[type]}
          </span>
          {isSelected && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Generator</h1>
          <p className="text-muted-foreground">
            Configure AI-powered affiliate blog post generation for your listings.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="destinations">Publishing</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* Publishing Destinations Tab */}
        <TabsContent value="destinations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Publishing Destination</CardTitle>
                  <CardDescription>
                    Select where you want to publish your content
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://developer.wordpress.org/rest-api/', '_blank')}
                >
                  WordPress Docs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Destination Type Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {['wordpress', 'blogger', 'shopify', 'webhook'].map((type) => (
                  <DestinationCard 
                    key={type} 
                    type={type} 
                    isSelected={selectedDestinationType === type} 
                  />
                ))}
                <Card 
                  className="cursor-pointer border-border hover:border-primary/50 transition-all"
                  onClick={() => setActiveTab('content')}
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <PenTool className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Editor</span>
                  </CardContent>
                </Card>
              </div>

              {/* Configuration Section */}
              <Card className="border-muted">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = DESTINATION_ICONS[selectedDestinationType] || Globe;
                      return <Icon className="h-5 w-5 text-muted-foreground" />;
                    })()}
                    <CardTitle className="text-lg">
                      {DESTINATION_LABELS[selectedDestinationType]} Configuration
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {destinations.filter(d => d.destination_type === selectedDestinationType).length === 0 ? (
                    <Alert className="bg-amber-500/10 border-amber-500/30">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-amber-500">
                        No {DESTINATION_LABELS[selectedDestinationType]} site found. Please add a site to get started.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {destinations
                        .filter(d => d.destination_type === selectedDestinationType)
                        .map((dest) => (
                          <div 
                            key={dest.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                {(() => {
                                  const Icon = DESTINATION_ICONS[dest.destination_type];
                                  return <Icon className="h-4 w-4 text-primary" />;
                                })()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{dest.name}</p>
                                {dest.site_url && (
                                  <a 
                                    href={dest.site_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                  >
                                    {dest.site_url} <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {dest.is_default && (
                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                  Default
                                </Badge>
                              )}
                              {!dest.is_default && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleSetDefault(dest.id)}
                                >
                                  Set Default
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteDestination(dest.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <Dialog open={showAddDestination} onOpenChange={setShowAddDestination}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        ADD {DESTINATION_LABELS[selectedDestinationType].toUpperCase()} SITE
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add {DESTINATION_LABELS[selectedDestinationType]} Site</DialogTitle>
                        <DialogDescription>
                          Configure your {DESTINATION_LABELS[selectedDestinationType]} integration.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Site Name</Label>
                          <Input 
                            placeholder={`My ${DESTINATION_LABELS[selectedDestinationType]} Site`}
                            value={newDestination.name}
                            onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
                          />
                        </div>
                        {selectedDestinationType === 'webhook' ? (
                          <div className="grid gap-2">
                            <Label>Webhook URL</Label>
                            <Input 
                              placeholder="https://your-webhook-url.com/endpoint"
                              value={newDestination.webhook_url}
                              onChange={(e) => setNewDestination({...newDestination, webhook_url: e.target.value})}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="grid gap-2">
                              <Label>Site URL</Label>
                              <Input 
                                placeholder="https://yourblog.com"
                                value={newDestination.site_url}
                                onChange={(e) => setNewDestination({...newDestination, site_url: e.target.value})}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>API Key / Application Password</Label>
                              <Input 
                                type="password"
                                placeholder="Enter your API key"
                                value={newDestination.api_key}
                                onChange={(e) => setNewDestination({...newDestination, api_key: e.target.value})}
                              />
                            </div>
                            {selectedDestinationType === 'wordpress' && (
                              <div className="grid gap-2">
                                <Label>Username</Label>
                                <Input 
                                  placeholder="admin"
                                  value={newDestination.username}
                                  onChange={(e) => setNewDestination({...newDestination, username: e.target.value})}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDestination(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddDestination}>
                          Add Site
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Amazon API Section */}
              <div className="flex items-center gap-2 pt-4">
                <Switch 
                  id="no-api"
                  checked={false}
                />
                <Label htmlFor="no-api" className="text-muted-foreground">
                  Don't have Amazon API? Write without API
                </Label>
              </div>

              <Card className="border-muted">
                <CardHeader>
                  <CardTitle className="text-lg">Select Amazon API</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-amber-500/10 border-amber-500/30">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-500">
                      No API Found. Please add an Amazon API
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    ADD AMAZON API
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>
                Configure how your blog posts are generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Content Style</Label>
                  <Select 
                    value={settings.content_style}
                    onValueChange={(value) => setSettings({...settings, content_style: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed_review">Detailed Review (800+ words)</SelectItem>
                      <SelectItem value="comparison">Comparison Style</SelectItem>
                      <SelectItem value="buying_guide">Buying Guide</SelectItem>
                      <SelectItem value="quick_summary">Quick Summary (400 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Amazon Affiliate Tag</Label>
                  <Input 
                    placeholder="your-affiliate-tag-20"
                    value={settings.affiliate_tag}
                    onChange={(e) => setSettings({...settings, affiliate_tag: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your affiliate tag will be added to all Amazon product links
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Pros & Cons</Label>
                      <p className="text-xs text-muted-foreground">Add a pros/cons section to reviews</p>
                    </div>
                    <Switch 
                      checked={settings.include_pros_cons}
                      onCheckedChange={(checked) => setSettings({...settings, include_pros_cons: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Specifications</Label>
                      <p className="text-xs text-muted-foreground">Add product specs breakdown</p>
                    </div>
                    <Switch 
                      checked={settings.include_specifications}
                      onCheckedChange={(checked) => setSettings({...settings, include_specifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Price History</Label>
                      <p className="text-xs text-muted-foreground">Show price trends when available</p>
                    </div>
                    <Switch 
                      checked={settings.include_price_history}
                      onCheckedChange={(checked) => setSettings({...settings, include_price_history: checked})}
                    />
                  </div>
                </div>

                <div className="grid gap-2 pt-4">
                  <Label>Custom Instructions (Optional)</Label>
                  <Textarea 
                    placeholder="Add any custom instructions for the AI writer..."
                    rows={4}
                    value={settings.custom_prompt}
                    onChange={(e) => setSettings({...settings, custom_prompt: e.target.value})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Modes</CardTitle>
              <CardDescription>
                Control how and when blog posts are generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Manual Mode */}
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <PenTool className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Manual Generation</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate blog posts one at a time from your listings page
                    </p>
                  </div>
                </div>
                <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Always Available
                </Badge>
              </div>

              {/* Bulk Mode */}
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Bulk Generation</h3>
                    <p className="text-sm text-muted-foreground">
                      Select multiple listings and generate posts for all at once
                    </p>
                  </div>
                </div>
                <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Always Available
                </Badge>
              </div>

              {/* Auto Mode */}
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Wifi className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Auto Generation</h3>
                      <p className="text-sm text-muted-foreground">
                        Automatically generate posts when new listings are synced
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.auto_generate_enabled}
                    onCheckedChange={(checked) => setSettings({...settings, auto_generate_enabled: checked})}
                  />
                </div>
                {settings.auto_generate_enabled && (
                  <div className="mt-4 pl-12 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-publish to default destination</Label>
                        <p className="text-xs text-muted-foreground">
                          Publish immediately after generation
                        </p>
                      </div>
                      <Switch 
                        checked={settings.auto_publish_enabled}
                        onCheckedChange={(checked) => setSettings({...settings, auto_publish_enabled: checked})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Default Destination</Label>
                      <Select 
                        value={settings.default_destination_id || "none"}
                        onValueChange={(value) => setSettings({
                          ...settings, 
                          default_destination_id: value === "none" ? null : value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No default (save as draft)</SelectItem>
                          {destinations.map((dest) => (
                            <SelectItem key={dest.id} value={dest.id}>
                              {dest.name} ({DESTINATION_LABELS[dest.destination_type]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Automation Settings"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
