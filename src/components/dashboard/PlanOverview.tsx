import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Zap, 
  Rocket, 
  Building2, 
  Sparkles,
  ArrowRight,
  CreditCard,
  Settings,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription, PLANS } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const planIcons = {
  free: Crown,
  starter: Zap,
  growth: Rocket,
  enterprise: Building2,
};

interface PlanOverviewProps {
  creditsRemaining: number;
  creditsMax: number;
}

export function PlanOverview({ creditsRemaining, creditsMax }: PlanOverviewProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { 
    planName, 
    subscribed, 
    subscriptionEnd, 
    isLoading, 
    openCustomerPortal,
    checkSubscription 
  } = useSubscription();

  const currentPlan = PLANS[planName as keyof typeof PLANS] || PLANS.free;
  const PlanIcon = planIcons[planName as keyof typeof planIcons] || Crown;
  
  const creditsUsed = creditsMax - creditsRemaining;
  const creditsPercent = Math.min((creditsRemaining / creditsMax) * 100, 100);
  const usedPercent = Math.min((creditsUsed / creditsMax) * 100, 100);

  // Get next tier info for upgrade prompt
  const getNextTier = () => {
    switch (planName) {
      case 'free': return { name: 'Starter', credits: 50, price: 19.99 };
      case 'starter': return { name: 'Growth', credits: 200, price: 49.99 };
      case 'growth': return { name: 'Enterprise', credits: 'Unlimited', price: 149.99 };
      default: return null;
    }
  };

  const nextTier = getNextTier();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header with Plan Info */}
      <div className="p-5 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              subscribed ? "bg-primary/10" : "bg-secondary"
            )}>
              <PlanIcon className={cn(
                "h-5 w-5",
                subscribed ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground flex items-center gap-2">
                {currentPlan.displayName} Plan
                {subscribed && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {subscribed && subscriptionEnd 
                  ? `Renews ${new Date(subscriptionEnd).toLocaleDateString()}`
                  : 'Free tier'
                }
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => checkSubscription()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Credits Section */}
      <div className="p-5 space-y-4">
        {/* Credits Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Credits Remaining</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-semibold text-foreground">
                {creditsRemaining}
              </span>
              <span className="text-sm text-muted-foreground">
                / {creditsMax === 9999 ? '∞' : creditsMax}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Credits Used</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-semibold text-foreground">
                {creditsUsed}
              </span>
              <span className="text-sm text-muted-foreground">
                this period
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                creditsPercent > 50 ? "bg-primary" : 
                creditsPercent > 20 ? "bg-amber-500" : "bg-destructive"
              )}
              style={{ width: `${creditsPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(usedPercent)}% used</span>
            <span>{Math.round(creditsPercent)}% remaining</span>
          </div>
        </div>

        {/* Plan Features Quick View */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Plan Features</p>
          <div className="grid grid-cols-2 gap-2">
            {currentPlan.features.slice(0, 4).map((feature, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                <div className="w-1 h-1 rounded-full bg-primary" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade Prompt or Management Options */}
      <div className="p-4 bg-secondary/30 border-t border-border">
        {!subscribed && nextTier ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">
                Upgrade to <strong>{nextTier.name}</strong> for {nextTier.credits} credits
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/dashboard/subscription')}
              className="h-8"
            >
              ${nextTier.price}/mo
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        ) : subscribed && nextTier ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openCustomerPortal()}
              className="flex-1 h-9"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard/subscription')}
              className="h-9"
            >
              <Settings className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openCustomerPortal()}
              className="flex-1 h-9"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          </div>
        )}
      </div>

      {/* Low Credits Warning */}
      {creditsRemaining < 10 && !subscribed && (
        <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Low on credits? Upgrade for more power!</span>
          </div>
        </div>
      )}
    </div>
  );
}
