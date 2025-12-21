import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotices } from '@/hooks/useRealtimeSync';
import { Button } from '@/components/ui/button';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const typeColors = {
  info: 'bg-primary/10 border-primary/30 text-primary',
  warning: 'bg-amazon/10 border-amazon/30 text-amazon',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
  success: 'bg-success/10 border-success/30 text-success',
};

export function NoticesBanner() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotices = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter notices based on date range
      const now = new Date();
      const activeNotices = (data || []).filter(notice => {
        const startsAt = notice.starts_at ? new Date(notice.starts_at) : null;
        const endsAt = notice.ends_at ? new Date(notice.ends_at) : null;
        
        if (startsAt && startsAt > now) return false;
        if (endsAt && endsAt < now) return false;
        
        return true;
      });

      setNotices(activeNotices);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Subscribe to realtime notice changes
  useRealtimeNotices(fetchNotices);

  // Load dismissed notices from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissedNotices');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedIds(new Set(parsed));
      } catch (e) {
        // Invalid stored data
      }
    }
  }, []);

  const dismissNotice = (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedNotices', JSON.stringify([...newDismissed]));
  };

  const visibleNotices = notices.filter(n => !dismissedIds.has(n.id));

  if (isLoading || visibleNotices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {visibleNotices.slice(0, 3).map((notice) => {
          const Icon = typeIcons[notice.type as keyof typeof typeIcons] || Info;
          const colorClass = typeColors[notice.type as keyof typeof typeColors] || typeColors.info;

          return (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className={`flex items-start gap-3 p-4 rounded-xl border ${colorClass}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">{notice.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{notice.content}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={() => dismissNotice(notice.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {visibleNotices.length > 3 && (
        <div className="text-center">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Bell className="h-4 w-4 mr-2" />
            {visibleNotices.length - 3} more notices
          </Button>
        </div>
      )}
    </div>
  );
}
