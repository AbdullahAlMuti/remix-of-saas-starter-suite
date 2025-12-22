import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireSubscription?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false,
  requireSubscription = false,
}: ProtectedRouteProps) {
  const { user, isAdmin, isSuperAdmin, isLoading } = useAuth();
  const { subscribed, isLoading: subscriptionLoading, planName } = useSubscription();
  const location = useLocation();

  if (isLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has a paid subscription (any plan except free without payment)
  // Users need to complete payment to access dashboard
  if (!subscribed) {
    // Check if there's a pending plan selection in localStorage
    const pendingPlanId = localStorage.getItem('selectedPlanId');
    if (pendingPlanId) {
      // User has selected a plan but hasn't completed payment - let Auth handle checkout
      return <Navigate to="/auth" replace />;
    }
    // No pending plan - redirect to plan selection
    return <Navigate to="/select-plan" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSubscription && !subscribed) {
    return <Navigate to="/select-plan" replace />;
  }

  return <>{children}</>;
}
