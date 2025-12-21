import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkSubscription, planName, subscribed } = useSubscription();
  const [status, setStatus] = useState<'verifying' | 'success' | 'redirecting'>('verifying');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const verifySubscription = async () => {
      // Refresh subscription status
      await checkSubscription();
      setStatus('success');

      // Wait a moment to show success, then redirect
      setTimeout(() => {
        setStatus('redirecting');
        // Clear selected plan from localStorage
        localStorage.removeItem('selectedPlan');
        navigate('/dashboard', { replace: true });
      }, 2500);
    };

    // Small delay to allow Stripe webhook to process
    const timer = setTimeout(verifySubscription, 1500);
    return () => clearTimeout(timer);
  }, [user, checkSubscription, navigate]);

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-12 text-center max-w-md w-full"
      >
        {status === 'verifying' ? (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-6 animate-spin" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              Verifying Payment...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your subscription.
            </p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="h-20 w-20 text-success mx-auto mb-6" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground mb-6">
              Welcome to the <span className="text-primary font-semibold capitalize">{planName}</span> plan.
              {subscribed && ' Your subscription is now active.'}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting to dashboard...</span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
