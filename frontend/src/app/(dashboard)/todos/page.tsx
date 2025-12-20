'use client';

import { useState } from 'react';
import { useTodoLists, useTodos } from '@/lib/hooks/use-todos';
import { CreateListDialog } from '@/components/todos/create-list-dialog';
import { CreateTodoDialog } from '@/components/todos/create-todo-dialog';
import { EditTodoDialog } from '@/components/todos/edit-todo-dialog';
import { TodoListCard } from '@/components/todos/todo-list-card';
import { TodoItem } from '@/components/todos/todo-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ListTodo } from 'lucide-react';
import type { TodoList, Todo } from '@/lib/api/todos';

export default function TodosPage() {
  const [selectedList, setSelectedList] = useState<TodoList | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: lists, isLoading: listsLoading } = useTodoLists();
  const { data: todos, isLoading: todosLoading } = useTodos(selectedList?.id || '');

  function handleSelectList(list: TodoList) {
    setSelectedList(list);
  }

  function handleBackToLists() {
    setSelectedList(null);
  }

  function handleEditTodo(todo: Todo) {
    setEditingTodo(todo);
    setEditDialogOpen(true);
  }

  // Show list grid when no list is selected
  if (!selectedList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Todo Lists</h1>
            <p className="text-muted-foreground mt-1">
              Organize your tasks with custom lists
            </p>
          </div>
          <CreateListDialog />
        </div>

        <Separator />

        {listsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : lists && lists.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <TodoListCard
                key={list.id}
                list={list}
                todoCount={0}
                onSelect={handleSelectList}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Lists Yet</CardTitle>
              <CardDescription>
                Create your first todo list to start organizing your tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateListDialog />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show todos for selected list
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToLists}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lists
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: selectedList.color }}
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedList.name}
            </h1>
            {selectedList.description && (
              <p className="text-muted-foreground mt-1">
                {selectedList.description}
              </p>
            )}
          </div>
        </div>
        <CreateTodoDialog listId={selectedList.id} />
      </div>

      <Separator />

      {todosLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : todos && todos.length > 0 ? (
        <div className="space-y-3">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onEdit={handleEditTodo} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              <CardTitle>No Tasks Yet</CardTitle>
            </div>
            <CardDescription>
              Add your first task to {selectedList.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTodoDialog listId={selectedList.id} />
          </CardContent>
        </Card>
      )}

      <EditTodoDialog
        todo={editingTodo}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
