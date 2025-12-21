import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  type: 'income' | 'expense';
}

const typeConfig = {
  income: { label: 'Income', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  expense: { label: 'Expense', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export function CategoryBadge({ type }: CategoryBadgeProps) {
  const config = typeConfig[type];

  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
