'use client';

import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryBadge } from './category-badge';
import { useDeleteTransaction } from '@/lib/hooks/use-fundflow';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/api/fundflow';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, onEdit }: TransactionItemProps) {
  const deleteTransactionMutation = useDeleteTransaction();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    await deleteTransactionMutation.mutateAsync(transaction.id);
  }

  const amountColor = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
  const amountPrefix = transaction.type === 'income' ? '+' : '-';

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">{transaction.description}</p>
          <CategoryBadge type={transaction.type} />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {transaction.category && (
            <>
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: transaction.category.color }}
              />
              <span>{transaction.category.name}</span>
              <span>•</span>
            </>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(transaction.date), 'PP')}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className={cn('text-lg font-semibold whitespace-nowrap', amountColor)}>
          {amountPrefix}${transaction.amount.toFixed(2)}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(transaction)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
