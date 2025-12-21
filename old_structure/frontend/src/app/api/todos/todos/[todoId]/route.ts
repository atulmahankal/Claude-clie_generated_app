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
 * GET /api/todos/todos/[todoId]
 *
 * Get a specific todo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
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

    const { todoId } = await params;
    const client = getTodosClient();

    const response: any = await promisifyGrpcCall(client, 'GetTodo', {
      todo_id: todoId,
      user_id: userId,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      todo: response.todo,
    });
  } catch (error: any) {
    console.error('Get todo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get todo' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/todos/todos/[todoId]
 *
 * Update a todo
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
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

    const { todoId } = await params;
    const body = await request.json();
    const { title, description, priority, due_date, completed } = body;

    const client = getTodosClient();

    const response: any = await promisifyGrpcCall(client, 'UpdateTodo', {
      todo_id: todoId,
      user_id: userId,
      title,
      description,
      priority,
      due_date,
      completed,
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
    console.error('Update todo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update todo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/todos/todos/[todoId]
 *
 * Delete a todo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
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

    const { todoId } = await params;
    const client = getTodosClient();

    const response: any = await promisifyGrpcCall(client, 'DeleteTodo', {
      todo_id: todoId,
      user_id: userId,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Delete todo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
