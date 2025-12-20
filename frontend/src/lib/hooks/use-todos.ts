/**
 * Todos Hooks
 *
 * React Query hooks for todos management
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as todosApi from '../api/todos';

const LISTS_QUERY_KEY = ['todos', 'lists'];
const todosQueryKey = (listId: string) => ['todos', 'todos', listId];

// ============= Lists Hooks =============

/**
 * Get all todo lists
 */
export function useTodoLists() {
  return useQuery({
    queryKey: LISTS_QUERY_KEY,
    queryFn: todosApi.getLists,
  });
}

/**
 * Create a new todo list
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todosApi.createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY });
      toast.success('List created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create list');
    },
  });
}

/**
 * Update a todo list
 */
export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: todosApi.UpdateListData }) =>
      todosApi.updateList(listId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY });
      toast.success('List updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update list');
    },
  });
}

/**
 * Delete a todo list
 */
export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todosApi.deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY });
      toast.success('List deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete list');
    },
  });
}

// ============= Todos Hooks =============

/**
 * Get todos for a specific list
 */
export function useTodos(listId: string) {
  return useQuery({
    queryKey: todosQueryKey(listId),
    queryFn: () => todosApi.getTodos(listId),
    enabled: !!listId,
  });
}

/**
 * Create a new todo
 */
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: todosApi.CreateTodoData }) =>
      todosApi.createTodo(listId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: todosQueryKey(variables.listId) });
      toast.success('Todo created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create todo');
    },
  });
}

/**
 * Update a todo
 */
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ todoId, data }: { todoId: string; data: todosApi.UpdateTodoData }) =>
      todosApi.updateTodo(todoId, data),
    onSuccess: () => {
      // Invalidate all todo queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['todos', 'todos'] });
      toast.success('Todo updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update todo');
    },
  });
}

/**
 * Delete a todo
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todosApi.deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', 'todos'] });
      toast.success('Todo deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete todo');
    },
  });
}

/**
 * Toggle todo completion status
 */
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todosApi.toggleTodo,
    onSuccess: () => {
      // Invalidate all todo queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['todos', 'todos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to toggle todo');
    },
  });
}
