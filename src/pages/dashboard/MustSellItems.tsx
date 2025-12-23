import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, HelpCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MustSellItem {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
  profit: number;
  sales_count: number;
  total_sold: number;
  country: string;
  category: string | null;
  ebay_url: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function MustSellItems() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: items, isLoading } = useQuery({
    queryKey: ['must-sell-items', searchQuery, selectedCountry],
    queryFn: async () => {
      let query = supabase
        .from('must_sell_items')
        .select('*')
        .eq('is_active', true)
        .order('sales_count', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (selectedCountry !== 'all') {
        query = query.eq('country', selectedCountry);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MustSellItem[];
    },
  });

  const totalPages = items ? Math.ceil(items.length / ITEMS_PER_PAGE) : 1;
  const paginatedItems = items?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Trending eBay Products</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Last 7 days</span>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={selectedCountry} onValueChange={(value) => {
            setSelectedCountry(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="US">🇺🇸 United States</SelectItem>
              <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="DE">🇩🇪 Germany</SelectItem>
              <SelectItem value="AU">🇦🇺 Australia</SelectItem>
              <SelectItem value="CA">🇨🇦 Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-20 h-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : paginatedItems?.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </Card>
          ) : (
            paginatedItems?.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="font-medium text-foreground line-clamp-2 text-sm">
                          {item.title}
                        </h3>
                        <span className="text-orange-500">🔥</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-8 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sales</p>
                        <p className="font-semibold text-foreground">{item.sales_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Sold</p>
                        <p className="font-semibold text-foreground">{item.total_sold}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Price</p>
                        <p className="font-semibold text-foreground">${item.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Profit</p>
                        <p className="font-semibold text-green-600">${item.profit.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Action */}
                    {item.ebay_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="flex-shrink-0"
                      >
                        <a href={item.ebay_url} target="_blank" rel="noopener noreferrer">
                          <Package className="h-5 w-5 text-primary" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Mobile Stats */}
                  <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t text-sm">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">Sales: <span className="text-foreground font-medium">{item.sales_count}</span></span>
                      <span className="text-muted-foreground">Sold: <span className="text-foreground font-medium">{item.total_sold}</span></span>
                    </div>
                    <div className="flex gap-4">
                      <span className="font-medium">${item.price.toFixed(2)}</span>
                      <span className="text-green-600 font-medium">${item.profit.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
    </div>
  );
}
