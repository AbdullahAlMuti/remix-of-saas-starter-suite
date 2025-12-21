import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  DollarSign,
  Sparkles,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  credits_per_month: number;
  max_listings: number;
  max_auto_orders: number;
  features: string[] | null;
  is_active: boolean;
}

interface PlanFormData {
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  credits_per_month: number;
  max_listings: number;
  max_auto_orders: number;
  is_active: boolean;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, display_name, price_monthly, price_yearly, credits_per_month, max_listings, max_auto_orders, features, is_active')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      
      const mappedPlans: Plan[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        display_name: p.display_name,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        credits_per_month: p.credits_per_month,
        max_listings: p.max_listings,
        max_auto_orders: p.max_auto_orders,
        features: Array.isArray(p.features) ? p.features as string[] : null,
        is_active: p.is_active,
      }));
      
      setPlans(mappedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to fetch plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async (formData: PlanFormData) => {
    try {
      if (editingPlan?.id) {
        const { error } = await supabase
          .from('plans')
          .update({
            name: formData.name,
            display_name: formData.display_name,
            price_monthly: formData.price_monthly,
            price_yearly: formData.price_yearly,
            credits_per_month: formData.credits_per_month,
            max_listings: formData.max_listings,
            max_auto_orders: formData.max_auto_orders,
            is_active: formData.is_active,
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Plan updated successfully');
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([{
            name: formData.name,
            display_name: formData.display_name,
            price_monthly: formData.price_monthly,
            price_yearly: formData.price_yearly,
            credits_per_month: formData.credits_per_month,
            max_listings: formData.max_listings,
            max_auto_orders: formData.max_auto_orders,
            is_active: formData.is_active,
          }]);

        if (error) throw error;
        toast.success('Plan created successfully');
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !isActive })
        .eq('id', planId);

      if (error) throw error;

      setPlans(plans.map(p => 
        p.id === planId ? { ...p, is_active: !isActive } : p
      ));

      toast.success(`Plan ${!isActive ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
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
          <h1 className="text-3xl font-display font-bold text-foreground">Plan Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure pricing tiers and features
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => setEditingPlan(null)}>
              <Plus className="h-5 w-5" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </DialogTitle>
            </DialogHeader>
            <PlanForm
              plan={editingPlan}
              onSave={handleSavePlan}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card p-6 relative ${
              !plan.is_active ? 'opacity-60' : ''
            } ${plan.name === 'growth' ? 'border-primary' : ''}`}
          >
            {plan.name === 'growth' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary to-purple-500 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground">
                  {plan.display_name}
                </h3>
                <p className="text-sm text-muted-foreground">{plan.name}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingPlan(plan);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                >
                  {plan.is_active ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : (
                    <Check className="h-4 w-4 text-success" />
                  )}
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-foreground">
                  ${plan.price_monthly}
                </span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ${plan.price_yearly}/year
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{plan.credits_per_month} AI credits/mo</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Package className="h-4 w-4 text-ebay" />
                <span>
                  {plan.max_listings === -1 ? 'Unlimited' : plan.max_listings} listings
                </span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <ShoppingCart className="h-4 w-4 text-amazon" />
                <span>
                  {plan.max_auto_orders === -1 ? 'Unlimited' : plan.max_auto_orders} auto-orders/day
                </span>
              </div>
            </div>

            {!plan.is_active && (
              <div className="mt-4 text-center">
                <span className="text-xs text-destructive font-medium">DISABLED</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Plan Form Component
function PlanForm({
  plan,
  onSave,
  onCancel,
}: {
  plan: Plan | null;
  onSave: (formData: PlanFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<PlanFormData>({
    name: plan?.name || '',
    display_name: plan?.display_name || '',
    price_monthly: plan?.price_monthly || 0,
    price_yearly: plan?.price_yearly || 0,
    credits_per_month: plan?.credits_per_month || 5,
    max_listings: plan?.max_listings || 10,
    max_auto_orders: plan?.max_auto_orders || 0,
    is_active: plan?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Internal Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., starter"
            className="bg-secondary/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_name" className="text-foreground">Display Name</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="e.g., Starter Plan"
            className="bg-secondary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_monthly" className="text-foreground">Monthly Price ($)</Label>
          <Input
            id="price_monthly"
            type="number"
            step="0.01"
            value={formData.price_monthly}
            onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
            className="bg-secondary/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_yearly" className="text-foreground">Yearly Price ($)</Label>
          <Input
            id="price_yearly"
            type="number"
            step="0.01"
            value={formData.price_yearly}
            onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
            className="bg-secondary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="credits" className="text-foreground">Credits/Month</Label>
          <Input
            id="credits"
            type="number"
            value={formData.credits_per_month}
            onChange={(e) => setFormData({ ...formData, credits_per_month: parseInt(e.target.value) })}
            className="bg-secondary/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="listings" className="text-foreground">Max Listings (-1 = ∞)</Label>
          <Input
            id="listings"
            type="number"
            value={formData.max_listings}
            onChange={(e) => setFormData({ ...formData, max_listings: parseInt(e.target.value) })}
            className="bg-secondary/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="orders" className="text-foreground">Max Orders/Day</Label>
          <Input
            id="orders"
            type="number"
            value={formData.max_auto_orders}
            onChange={(e) => setFormData({ ...formData, max_auto_orders: parseInt(e.target.value) })}
            className="bg-secondary/50"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="hero">
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
}
