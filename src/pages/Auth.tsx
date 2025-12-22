import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      // Always redirect to plan selection for new users or those without active subscription
      navigate('/select-plan', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode !== 'forgot-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        
        if (error) throw error;
        
        setResetEmailSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (!error) {
          // Will be redirected by useEffect when user state updates
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (!error) {
          setMode('login');
          toast.success('Account created! Please sign in.');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setResetEmailSent(false);
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot-password': return 'Reset Password';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to access your dashboard';
      case 'signup': return 'Start your dropshipping automation journey';
      case 'forgot-password': return 'Enter your email to receive a reset link';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-display font-bold text-foreground">SellerSuit</span>
          </a>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {getTitle()}
            </h1>
            <p className="text-muted-foreground">
              {getDescription()}
            </p>
          </div>

          {resetEmailSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg bg-success/10 text-success">
                <p>Check your email for a password reset link.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => switchMode('login')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className={`pl-10 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground ${
                      errors.email ? 'border-destructive' : ''
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {mode !== 'forgot-password' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot-password')}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      className={`pl-10 pr-10 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground ${
                        errors.password ? 'border-destructive' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            {mode === 'forgot-password' ? (
              <p className="text-muted-foreground">
                Remember your password?
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="ml-1 text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="ml-1 text-primary hover:underline font-medium"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Note about email confirmation */}
        {mode === 'signup' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-4 text-sm text-muted-foreground"
          >
            You may need to confirm your email before signing in.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
