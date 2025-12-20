'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, ListTodo } from 'lucide-react';
import { useDeleteList } from '@/lib/hooks/use-todos';
import type { TodoList } from '@/lib/api/todos';
import { cn } from '@/lib/utils';

interface TodoListCardProps {
  list: TodoList;
  todoCount: number;
  onSelect: (list: TodoList) => void;
}

export function TodoListCard({ list, todoCount, onSelect }: TodoListCardProps) {
  const deleteMutation = useDeleteList();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${list.name}"? All todos in this list will be deleted.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(list.id);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:scale-105',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
      onClick={() => onSelect(list)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: list.color }}
            />
            <CardTitle className="text-lg">{list.name}</CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {list.description && (
          <CardDescription className="mt-1.5">
            {list.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          <span>
            {todoCount} {todoCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
