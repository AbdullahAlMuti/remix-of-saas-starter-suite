import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'accent';
  progress?: number;
  sparklineData?: number[];
}

export function StatsCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  progress,
  sparklineData,
}: StatsCardProps) {
  const variantStyles = {
    default: {
      iconBg: 'bg-secondary',
      iconColor: 'text-muted-foreground',
      progressBg: 'bg-primary',
    },
    success: {
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      progressBg: 'bg-emerald-500',
    },
    warning: {
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      progressBg: 'bg-amber-500',
    },
    accent: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      progressBg: 'bg-primary',
    },
  };

  const styles = variantStyles[variant];
  const isPositive = change !== undefined && change >= 0;
  const hasChange = change !== undefined;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          styles.iconBg,
          "group-hover:bg-primary/15"
        )}>
          <Icon className={cn("h-5 w-5", styles.iconColor, "group-hover:text-primary transition-colors")} />
        </div>
        
        {hasChange && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
            isPositive 
              ? "bg-emerald-500/10 text-emerald-500" 
              : "bg-red-500/10 text-red-500"
          )}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}{change}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="space-y-1">
        <p className="text-2xl font-display font-semibold text-foreground tracking-tight">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70">{subtitle}</p>
        )}
      </div>

      {/* Optional Progress Bar */}
      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", styles.progressBg)}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
          {changeLabel && (
            <p className="text-xs text-muted-foreground mt-2">{changeLabel}</p>
          )}
        </div>
      )}

      {/* Optional Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 h-8">
          <Sparkline data={sparklineData} variant={variant} />
        </div>
      )}
    </div>
  );
}

// Mini Sparkline Chart Component
function Sparkline({ 
  data, 
  variant 
}: { 
  data: number[]; 
  variant: 'default' | 'success' | 'warning' | 'accent';
}) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const width = 100;
  const height = 32;
  const padding = 2;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * usableWidth;
    const y = padding + usableHeight - ((value - min) / range) * usableHeight;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = {
    default: 'hsl(var(--muted-foreground))',
    success: 'hsl(142, 76%, 45%)',
    warning: 'hsl(38, 92%, 50%)',
    accent: 'hsl(var(--primary))',
  }[variant];

  const fillColor = {
    default: 'hsl(var(--muted-foreground) / 0.1)',
    success: 'hsl(142, 76%, 45%, 0.15)',
    warning: 'hsl(38, 92%, 50%, 0.15)',
    accent: 'hsl(var(--primary) / 0.15)',
  }[variant];

  // Create area fill path
  const firstPoint = `${padding},${height - padding}`;
  const lastPoint = `${width - padding},${height - padding}`;
  const areaPath = `M${firstPoint} L${points} L${lastPoint} Z`;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {/* Area fill */}
      <path
        d={areaPath}
        fill={fillColor}
      />
      {/* Line */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* End dot */}
      <circle
        cx={width - padding}
        cy={padding + usableHeight - ((data[data.length - 1] - min) / range) * usableHeight}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
}

// Compact Stats Card for smaller spaces
export function CompactStatsCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'accent';
}) {
  const variantStyles = {
    default: 'bg-secondary text-muted-foreground',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    accent: 'bg-primary/10 text-primary',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/20 transition-colors">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", variantStyles[variant])}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}