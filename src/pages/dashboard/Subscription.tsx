import { motion } from 'framer-motion';
import { Check, Crown, Zap, Rocket, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription, PLANS } from '@/hooks/useSubscription';
import { format } from 'date-fns';

const planIcons = {
  free: Crown,
  starter: Zap,
  growth: Rocket,
  enterprise: Building2,
};

export default function Subscription() {
  const { 
    planName, 
    subscribed, 
    subscriptionEnd, 
    isLoading, 
    createCheckout, 
    openCustomerPortal,
    checkSubscription 
  } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => checkSubscription()}>
            Refresh Status
          </Button>
          {subscribed && (
            <Button onClick={() => openCustomerPortal()}>
              Manage Billing
            </Button>
          )}
        </div>
      </div>

      {/* Current Plan Status */}
      {subscribed && subscriptionEnd && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Active Subscription
            </CardTitle>
            <CardDescription>
              Your {PLANS[planName as keyof typeof PLANS]?.displayName || planName} plan renews on{' '}
              {format(new Date(subscriptionEnd), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PLANS).map(([key, plan], index) => {
          const Icon = planIcons[key as keyof typeof planIcons];
          const isCurrentPlan = planName === key;
          const isPaid = plan.priceMonthly > 0;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full ${isCurrentPlan ? 'border-primary shadow-lg' : ''}`}>
                {isCurrentPlan && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Current Plan
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{plan.displayName}</CardTitle>
                  </div>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">
                      ${plan.priceMonthly}
                    </span>
                    {isPaid && <span className="text-muted-foreground">/month</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'secondary' : 'default'}
                    disabled={isCurrentPlan || !isPaid}
                    onClick={() => isPaid && createCheckout(key as keyof typeof PLANS)}
                  >
                    {isCurrentPlan 
                      ? 'Current Plan' 
                      : !isPaid 
                        ? 'Free Plan' 
                        : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ or Help */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Contact our support team if you have questions about billing or subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Contact Support</Button>
        </CardContent>
      </Card>
    </div>
  );
}
