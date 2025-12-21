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
 * POST /api/todos/todos/[todoId]/toggle
 *
 * Toggle a todo's completion status
 */
export async function POST(
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

    const response: any = await promisifyGrpcCall(client, 'ToggleTodo', {
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
      todo: response.todo,
    });
  } catch (error: any) {
    console.error('Toggle todo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle todo' },
      { status: 500 }
    );
  }
}
