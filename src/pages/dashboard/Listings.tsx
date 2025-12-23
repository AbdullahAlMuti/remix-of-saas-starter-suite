import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  Filter, 
  Plus, 
  RefreshCw,
  ExternalLink,
  Edit,
  Trash2,
  Search,
  Activity,
  AlertCircle,
  PenTool,
  X,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { format } from "date-fns";
import InventoryStatusBadge from "@/components/listings/InventoryStatusBadge";
import PriceUpdateIndicator from "@/components/listings/PriceUpdateIndicator";

interface Listing {
  id: string;
  created_at: string;
  title: string | null;
  sku: string | null;
  ebay_item_id: string | null;
  ebay_price: number | null;
  amazon_price: number | null;
  amazon_asin: string | null;
  amazon_url: string | null;
  status: string | null;
  auto_order_enabled: boolean | null;
  amazon_stock_quantity?: number | null;
  amazon_stock_status?: string | null;
  price_last_updated?: string | null;
  inventory_last_updated?: string | null;
  sync_error?: string | null;
}

interface ListingStats {
  totalSourcingCost: number;
  totalInventoryValue: number;
  netProfitForecast: number;
}

export default function Listings() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ListingStats>({
    totalSourcingCost: 0,
    totalInventoryValue: 0,
    netProfitForecast: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewListingDialog, setShowNewListingDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);

  const userCredits = profile?.credits || 0;

  // New listing form state
  const [newListing, setNewListing] = useState({
    title: "",
    sku: "",
    amazon_asin: "",
    amazon_url: "",
    amazon_price: "",
    ebay_price: "",
    ebay_item_id: "",
  });

  const fetchListings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const listingsData = data || [];
      setListings(listingsData);
      setFilteredListings(listingsData);

      // Calculate stats
      const totalSourcingCost = listingsData.reduce((sum, listing) => sum + (listing.amazon_price || 0), 0);
      const totalInventoryValue = listingsData.reduce((sum, listing) => sum + (listing.ebay_price || 0), 0);
      const netProfitForecast = totalInventoryValue - totalSourcingCost;

      setStats({ totalSourcingCost, totalInventoryValue, netProfitForecast });
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch listings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [user]);

  // Real-time sync for listings
  useRealtimeSync(
    user ? [
      {
        table: 'listings',
        event: '*',
        filter: `user_id=eq.${user.id}`,
        callback: (payload) => {
          console.log('[Realtime] Listing changed:', payload.eventType);
          fetchListings();
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Listing",
              description: "A new listing was synced from extension",
            });
          }
        },
      },
    ] : [],
    [user?.id]
  );

  // Filter listings when search or status filter changes
  useEffect(() => {
    let filtered = listings;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.title?.toLowerCase().includes(query) ||
        listing.sku?.toLowerCase().includes(query) ||
        listing.amazon_asin?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(listing => listing.status === statusFilter);
    }

    setFilteredListings(filtered);
  }, [searchQuery, statusFilter, listings]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchListings();
    toast({
      title: "Refreshed",
      description: "Listings data has been updated",
    });
  };

  const handleSyncInventory = async (listingId?: string) => {
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('amazon-inventory-sync', {
        body: { action: listingId ? 'sync' : 'sync-all', listingId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sync Complete",
          description: `Updated ${data.results?.length || 0} listings from Amazon`,
        });
        fetchListings();
      } else {
        setSyncError(data.error);
        toast({
          title: "Sync Failed",
          description: data.error || "Failed to sync with Amazon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing inventory:', error);
      toast({
        title: "Error",
        description: "Failed to sync inventory",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateListing = async () => {
    if (!user) return;

    // Check credits first
    if (userCredits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need more credits to create a listing. Please recharge your credits.",
        variant: "destructive",
      });
      return;
    }

    if (!newListing.title || !newListing.amazon_asin) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { error } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          title: newListing.title,
          sku: newListing.sku || null,
          amazon_asin: newListing.amazon_asin,
          amazon_url: newListing.amazon_url || null,
          amazon_price: newListing.amazon_price ? parseFloat(newListing.amazon_price) : null,
          ebay_price: newListing.ebay_price ? parseFloat(newListing.ebay_price) : null,
          ebay_item_id: newListing.ebay_item_id || null,
          status: "active",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing created successfully",
      });

      setNewListing({
        title: "",
        sku: "",
        amazon_asin: "",
        amazon_url: "",
        amazon_price: "",
        ebay_price: "",
        ebay_item_id: "",
      });
      setShowNewListingDialog(false);
      fetchListings();
    } catch (error) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Listing has been removed",
      });

      fetchListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case "paused":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Paused</Badge>;
      case "out_of_stock":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const calculateProfit = (ebayPrice: number | null, amazonPrice: number | null) => {
    if (!ebayPrice || !amazonPrice) return null;
    return ebayPrice - amazonPrice;
  };

  // Selection handlers
  const toggleSelectListing = (listingId: string) => {
    setSelectedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedListings.size === filteredListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(filteredListings.map(l => l.id)));
    }
  };

  const clearSelection = () => {
    setSelectedListings(new Set());
  };

  // Blog generation handler
  const handleGenerateBlogPost = async (listingIds: string[], mode: 'manual' | 'bulk') => {
    if (listingIds.length === 0) {
      toast({
        title: "No listings selected",
        description: "Please select at least one listing to generate a blog post.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBlog(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: {
          listingIds,
          generationMode: mode,
        },
      });

      if (error) throw error;

      if (data.success) {
        const { summary } = data;
        toast({
          title: "Blog Posts Generated",
          description: `Successfully generated ${summary.successful} of ${summary.total} blog posts.`,
        });
        
        if (mode === 'bulk') {
          clearSelection();
        }
      } else {
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate blog posts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating blog posts:", error);
      toast({
        title: "Error",
        description: "Failed to generate blog posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Active Listings</h1>
          <p className="text-muted-foreground">Manage your eBay to Amazon product mappings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSyncInventory()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Sync Inventory
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Listings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("paused")}>
                Paused Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("out_of_stock")}>
                Out of Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showNewListingDialog} onOpenChange={setShowNewListingDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                disabled={userCredits < 1}
                title={userCredits < 1 ? "You need credits to create listings" : undefined}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
                <DialogDescription>
                  Add a new product mapping between Amazon and eBay. (1 credit required)
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter product title"
                    value={newListing.title}
                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="e.g., B07121HL8M"
                      value={newListing.sku}
                      onChange={(e) => setNewListing({ ...newListing, sku: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="asin">Amazon ASIN *</Label>
                    <Input
                      id="asin"
                      placeholder="e.g., B07121HL8M"
                      value={newListing.amazon_asin}
                      onChange={(e) => setNewListing({ ...newListing, amazon_asin: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amazon_url">Amazon URL</Label>
                  <Input
                    id="amazon_url"
                    placeholder="https://amazon.com/dp/..."
                    value={newListing.amazon_url}
                    onChange={(e) => setNewListing({ ...newListing, amazon_url: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amazon_price">Amazon Price ($)</Label>
                    <Input
                      id="amazon_price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newListing.amazon_price}
                      onChange={(e) => setNewListing({ ...newListing, amazon_price: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ebay_price">eBay Price ($)</Label>
                    <Input
                      id="ebay_price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newListing.ebay_price}
                      onChange={(e) => setNewListing({ ...newListing, ebay_price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ebay_item_id">eBay Item ID</Label>
                  <Input
                    id="ebay_item_id"
                    placeholder="e.g., 123456789012"
                    value={newListing.ebay_item_id}
                    onChange={(e) => setNewListing({ ...newListing, ebay_item_id: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewListingDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateListing} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Listing"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-muted bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-400 uppercase tracking-wide">Total Sourcing Cost</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    <span className="text-muted-foreground text-lg mr-1">$</span>
                    {stats.totalSourcingCost.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Amazon Product Total</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-muted bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-400 uppercase tracking-wide">Total Inventory Value</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    <span className="text-muted-foreground text-lg mr-1">$</span>
                    {stats.totalInventoryValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">eBay Listing Sum</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Package className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-muted bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-400 uppercase tracking-wide">Net Profit Forecast</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">
                    <span className="text-emerald-400/70 text-lg mr-1">$</span>
                    {stats.netProfitForecast.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">After Fees & Costs</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, SKU, or ASIN..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedListings.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="border-primary/30 bg-card/95 backdrop-blur shadow-xl">
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">
                    {selectedListings.size} selected
                  </span>
                </div>
                <div className="h-6 w-px bg-border" />
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => handleGenerateBlogPost(Array.from(selectedListings), 'bulk')}
                  disabled={isGeneratingBlog}
                >
                  {isGeneratingBlog ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <PenTool className="h-4 w-4 mr-2" />
                      Generate Blog Posts
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredListings.length > 0 && selectedListings.size === filteredListings.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-muted-foreground">DATE</TableHead>
                <TableHead className="text-muted-foreground">TITLE</TableHead>
                <TableHead className="text-muted-foreground">SKU</TableHead>
                <TableHead className="text-muted-foreground">EBAY PRICE</TableHead>
                <TableHead className="text-muted-foreground">AMAZON COST</TableHead>
                <TableHead className="text-muted-foreground">INVENTORY</TableHead>
                <TableHead className="text-muted-foreground">PROFIT</TableHead>
                <TableHead className="text-muted-foreground">STATUS</TableHead>
                <TableHead className="text-muted-foreground text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Loading listings...</p>
                  </TableCell>
                </TableRow>
              ) : filteredListings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-2">No listings found</p>
                    <p className="text-sm text-muted-foreground/70">Click "New Listing" to add your first product</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredListings.map((listing) => {
                  const profit = calculateProfit(listing.ebay_price, listing.amazon_price);
                  const isSelected = selectedListings.has(listing.id);
                  return (
                    <TableRow 
                      key={listing.id} 
                      className={`border-border/30 ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectListing(listing.id)}
                          aria-label={`Select ${listing.title}`}
                        />
                      </TableCell>
                      <TableCell className="text-foreground">
                        {listing.created_at ? format(new Date(listing.created_at), "MM/dd/yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[200px]">
                            {listing.title || "-"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">ID: {listing.amazon_asin || "N/A"}</span>
                            {listing.amazon_url && (
                              <a 
                                href={listing.amazon_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                Amazon <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-mono text-sm">{listing.sku || "-"}</span>
                        {listing.sku && (
                          <p className="text-xs text-muted-foreground">{listing.sku}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        ${listing.ebay_price?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <PriceUpdateIndicator 
                          currentPrice={listing.amazon_price} 
                          lastUpdated={listing.price_last_updated ?? null}
                        />
                      </TableCell>
                      <TableCell>
                        <InventoryStatusBadge 
                          stockStatus={listing.amazon_stock_status ?? null}
                          stockQuantity={listing.amazon_stock_quantity ?? null}
                          lastUpdated={listing.inventory_last_updated ?? null}
                        />
                      </TableCell>
                      <TableCell>
                        {profit !== null ? (
                          <span className={`font-medium ${profit >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                            ${profit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(listing.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="Generate Blog Post"
                            onClick={() => handleGenerateBlogPost([listing.id], 'manual')}
                            disabled={isGeneratingBlog}
                          >
                            <PenTool className="h-4 w-4 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleRefresh()}
                          >
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
