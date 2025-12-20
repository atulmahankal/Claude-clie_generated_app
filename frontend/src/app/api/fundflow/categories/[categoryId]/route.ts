import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getFundflowClient, promisifyGrpcCall } from '@/lib/grpc/client';

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
 * GET /api/fundflow/categories/[categoryId]
 *
 * Get a specific category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
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

    const { categoryId } = await params;
    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'GetCategory', {
      category_id: categoryId,
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
      category: response.category,
    });
  } catch (error: any) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get category' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fundflow/categories/[categoryId]
 *
 * Update a category
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
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

    const { categoryId } = await params;
    const body = await request.json();
    const { name, color, icon } = body;

    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'UpdateCategory', {
      category_id: categoryId,
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
      category: response.category,
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fundflow/categories/[categoryId]
 *
 * Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
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

    const { categoryId } = await params;
    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'DeleteCategory', {
      category_id: categoryId,
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
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
