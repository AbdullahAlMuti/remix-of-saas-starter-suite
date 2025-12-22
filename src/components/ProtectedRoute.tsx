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

  // Require plan selection - users without active subscription must select a plan first
  if (!subscribed) {
    return <Navigate to="/select-plan" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSubscription && !subscribed) {
    return <Navigate to="/payment-required" replace />;
  }

  return <>{children}</>;
}
