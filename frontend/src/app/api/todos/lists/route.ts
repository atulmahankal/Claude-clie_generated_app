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
 * GET /api/todos/lists
 *
 * Get all todo lists for the current user
 */
export async function GET(request: NextRequest) {
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

    const client = getTodosClient();

    const response: any = await promisifyGrpcCall(client, 'GetLists', {
      user_id: userId,
    });

    return NextResponse.json({
      success: true,
      lists: response.lists || [],
    });
  } catch (error: any) {
    console.error('Get lists error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get lists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/todos/lists
 *
 * Create a new todo list
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, color, icon } = body;

    const client = getTodosClient();

    const response: any = await promisifyGrpcCall(client, 'CreateList', {
      user_id: userId,
      name,
      color: color || '#3B82F6',
      icon: icon || 'list',
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
    console.error('Create list error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create list' },
      { status: 500 }
    );
  }
}
