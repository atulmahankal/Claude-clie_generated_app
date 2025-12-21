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
 * GET /api/todos/[listId]
 *
 * Get a specific todo list
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

    const response: any = await promisifyGrpcCall(client, 'GetList', {
      list_id: listId,
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
      list: response.list,
    });
  } catch (error: any) {
    console.error('Get list error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get list' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/todos/[listId]
 *
 * Update a todo list
 */
export async function PATCH(
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
    const { name, color, icon } = body;

    const client = getTodosClient();

    const response: any = await promisifyGrpcCall(client, 'UpdateList', {
      list_id: listId,
      user_id: userId,
      name,
      color,
      icon,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      list: response.list,
    });
  } catch (error: any) {
    console.error('Update list error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update list' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/todos/[listId]
 *
 * Delete a todo list
 */
export async function DELETE(
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

    const response: any = await promisifyGrpcCall(client, 'DeleteList', {
      list_id: listId,
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
    console.error('Delete list error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete list' },
      { status: 500 }
    );
  }
}
