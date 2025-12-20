'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react';
import { PriorityBadge } from './priority-badge';
import { useToggleTodo, useDeleteTodo } from '@/lib/hooks/use-todos';
import { cn } from '@/lib/utils';
import type { Todo } from '@/lib/api/todos';

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

export function TodoItem({ todo, onEdit }: TodoItemProps) {
  const toggleTodoMutation = useToggleTodo();
  const deleteTodoMutation = useDeleteTodo();
  const [isDeleting, setIsDeleting] = useState(false);

  function handleToggle() {
    toggleTodoMutation.mutate(todo.id);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTodoMutation.mutateAsync(todo.id);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-accent/50',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={handleToggle}
        disabled={toggleTodoMutation.isPending || isDeleting}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'font-medium truncate',
              todo.completed && 'line-through text-muted-foreground'
            )}
          >
            {todo.title}
          </p>
          <PriorityBadge priority={todo.priority} />
        </div>

        {todo.description && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {todo.description}
          </p>
        )}

        {todo.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(todo.due_date), 'PPP')}</span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isDeleting}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(todo)}>
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
  );
}
