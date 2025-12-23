import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Download,
  ExternalLink,
  RefreshCw,
  Package,
  MapPin,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AutoOrder {
  id: string;
  created_at: string;
  ebay_order_id: string | null;
  ebay_sku: string | null;
  item_price: number | null;
  total_cost: number | null;
  profit: number | null;
  amazon_order_id: string | null;
  buyer_name: string | null;
  buyer_address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  } | null;
  status: string | null;
}

interface OrderStats {
  totalEbaySales: number;
  totalAmazonCost: number;
  netProfit: number;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AutoOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalEbaySales: 0,
    totalAmazonCost: 0,
    netProfit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("auto_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ordersData = data || [];
      setOrders(ordersData as AutoOrder[]);

      // Calculate stats
      const totalEbaySales = ordersData.reduce((sum, order) => sum + (order.item_price || 0), 0);
      const totalAmazonCost = ordersData.reduce((sum, order) => sum + (order.total_cost || 0), 0);
      const netProfit = totalEbaySales - totalAmazonCost;

      setStats({ totalEbaySales, totalAmazonCost, netProfit });
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    toast({
      title: "Refreshed",
      description: "Orders data has been updated",
    });
  };

  const exportToCSV = () => {
    const headers = ["Date", "Order ID", "QTY", "eBay $", "Amazon $", "Profit", "Amazon Order ID", "Buyer", "Status"];
    const csvContent = [
      headers.join(","),
      ...orders.map(order => [
        order.created_at ? format(new Date(order.created_at), "MM/dd/yyyy") : "",
        order.ebay_order_id || "",
        "1",
        order.item_price?.toFixed(2) || "0.00",
        order.total_cost?.toFixed(2) || "0.00",
        order.profit?.toFixed(2) || "0.00",
        order.amazon_order_id || "Pending",
        order.buyer_name || "",
        order.status || "",
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auto-orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Orders exported to CSV successfully",
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Processing</Badge>;
      case "failed":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Failed</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Needs Mapping</Badge>;
    }
  };

  const formatAddress = (address: AutoOrder["buyer_address"], buyerName: string | null) => {
    if (!address) return null;
    return (
      <div className="text-sm">
        <p className="font-medium text-foreground">{buyerName}</p>
        {address.street && <p className="text-muted-foreground">{address.street}</p>}
        {(address.city || address.state || address.zip) && (
          <p className="text-muted-foreground">
            {address.city}{address.city && address.state && ", "}{address.state} {address.zip}
          </p>
        )}
        {address.phone && (
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <Phone className="h-3 w-3" />
            {address.phone}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auto-Order History</h1>
          <p className="text-muted-foreground">Track status of automated fulfillment.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={exportToCSV}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-destructive hover:bg-destructive/90"
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="default"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Orders
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <ShoppingCart className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-400 uppercase tracking-wide">Total eBay Sales</p>
                  <p className="text-3xl font-bold text-foreground">${stats.totalEbaySales.toFixed(2)}</p>
                  <p className="text-sm text-blue-400/70">Revenue from all orders</p>
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
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <DollarSign className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-400 uppercase tracking-wide">Total Amazon Cost</p>
                  <p className="text-3xl font-bold text-foreground">${stats.totalAmazonCost.toFixed(2)}</p>
                  <p className="text-sm text-amber-400/70">Total purchase expenses</p>
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
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-400 uppercase tracking-wide">Net Profit</p>
                  <p className="text-3xl font-bold text-foreground">${stats.netProfit.toFixed(2)}</p>
                  <p className="text-sm text-emerald-400/70">eBay Sales - Amazon Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">ORDER DATE</TableHead>
                <TableHead className="text-muted-foreground">ORDER ID</TableHead>
                <TableHead className="text-muted-foreground">QTY</TableHead>
                <TableHead className="text-muted-foreground">EBAY $</TableHead>
                <TableHead className="text-muted-foreground">AMAZON $</TableHead>
                <TableHead className="text-muted-foreground">PROFIT</TableHead>
                <TableHead className="text-muted-foreground">AMZ ORDER ID</TableHead>
                <TableHead className="text-muted-foreground">SHIP DETAILS</TableHead>
                <TableHead className="text-muted-foreground text-right">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Loading orders...</p>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-2">No orders yet</p>
                    <p className="text-sm text-muted-foreground/70">Orders will appear here when you start selling</p>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="border-border/30">
                    <TableCell className="text-foreground">
                      {order.created_at ? format(new Date(order.created_at), "MM/dd/yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      {order.ebay_order_id ? (
                        <span
                          role="button"
                          className="text-primary font-mono hover:underline inline-block relative z-10 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`https://www.ebay.com/sh/ord/details?orderid=${order.ebay_order_id}`, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          {order.ebay_order_id}
                        </span>

                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">1</TableCell>
                    <TableCell className="text-foreground">${order.item_price?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell className="text-foreground">${order.total_cost?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>
                      <span className="text-emerald-400 font-medium">
                        +${order.profit?.toFixed(2) || "0.00"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {order.amazon_order_id ? (
                        <span
                          role="button"
                          className="text-primary font-mono hover:underline inline-block relative z-10 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`https://www.amazon.com/your-orders/search/ref=ppx_yo2ov_dt_b_search?opt=ab&search=${order.amazon_order_id}`, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          {order.amazon_order_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatAddress(order.buyer_address, order.buyer_name) || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
