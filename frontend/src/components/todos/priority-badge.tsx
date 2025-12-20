import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const priorityConfig = {
  low: { label: 'Low', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
