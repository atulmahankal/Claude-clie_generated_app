/**
 * Todos API Client
 *
 * Wrapper functions for todos API endpoints
 */

export interface TodoList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  list_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateListData {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateListData {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed?: boolean;
}

// ============= Todo Lists =============

export async function getLists(): Promise<TodoList[]> {
  const response = await fetch('/api/todos/lists', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch lists');
  }

  const data = await response.json();
  return data.lists || [];
}

export async function createList(data: CreateListData): Promise<TodoList> {
  const response = await fetch('/api/todos/lists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create list');
  }

  const result = await response.json();
  return result.list;
}

export async function getList(listId: string): Promise<TodoList> {
  const response = await fetch(`/api/todos/${listId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch list');
  }

  const data = await response.json();
  return data.list;
}

export async function updateList(listId: string, data: UpdateListData): Promise<TodoList> {
  const response = await fetch(`/api/todos/${listId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update list');
  }

  const result = await response.json();
  return result.list;
}

export async function deleteList(listId: string): Promise<void> {
  const response = await fetch(`/api/todos/${listId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete list');
  }
}

// ============= Todos =============

export async function getTodos(listId: string): Promise<Todo[]> {
  const response = await fetch(`/api/todos/${listId}/todos`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }

  const data = await response.json();
  return data.todos || [];
}

export async function createTodo(listId: string, data: CreateTodoData): Promise<Todo> {
  const response = await fetch(`/api/todos/${listId}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create todo');
  }

  const result = await response.json();
  return result.todo;
}

export async function getTodo(todoId: string): Promise<Todo> {
  const response = await fetch(`/api/todos/todos/${todoId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch todo');
  }

  const data = await response.json();
  return data.todo;
}

export async function updateTodo(todoId: string, data: UpdateTodoData): Promise<Todo> {
  const response = await fetch(`/api/todos/todos/${todoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update todo');
  }

  const result = await response.json();
  return result.todo;
}

export async function deleteTodo(todoId: string): Promise<void> {
  const response = await fetch(`/api/todos/todos/${todoId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete todo');
  }
}

export async function toggleTodo(todoId: string): Promise<Todo> {
  const response = await fetch(`/api/todos/todos/${todoId}/toggle`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to toggle todo');
  }

  const result = await response.json();
  return result.todo;
}
