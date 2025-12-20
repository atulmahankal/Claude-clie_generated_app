import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getTodosClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * Helper to get user ID from token
 */
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const client = getAuthClient();
    const validation: any = await promisifyGrpcCall(client, 'ValidateToken', { token });

    if (!validation.valid) {
      return null;
    }

    return validation.user_id;
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/todos/[listId]/todos
 *
 * Get all todos for a specific list
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { listId } = await params;
    const client = getTodosClient();

    const response: any = await promisifyGrpcCall(client, 'GetTodos', {
      list_id: listId,
      user_id: userId,
      completed_only: false,
      active_only: false,
    });

    return NextResponse.json({
      success: true,
      todos: response.todos || [],
    });
  } catch (error: any) {
    console.error('Get todos error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get todos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/todos/[listId]/todos
 *
 * Create a new todo in a list
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { listId } = await params;
    const body = await request.json();
    const { title, description, priority, due_date } = body;

    const client = getTodosClient();

    const response: any = await promisifyGrpcCall(client, 'CreateTodo', {
      list_id: listId,
      user_id: userId,
      title,
      description: description || '',
      priority: priority || 'medium',
      due_date: due_date || '',
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      todo: response.todo,
    });
  } catch (error: any) {
    console.error('Create todo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create todo' },
      { status: 500 }
    );
  }
}
