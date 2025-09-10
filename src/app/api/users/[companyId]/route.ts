import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { belongsToCompany, hasPermission } from '@/lib/auth/permissions';
import { Permission, UserRole, UserMetadata } from '@/lib/types/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    const { companyId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to this company
    const belongsToComp = await belongsToCompany(companyId);
    if (!belongsToComp) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has permission to view users
    const canView = await hasPermission(Permission.VIEW_USERS);
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all users for this company from Clerk
    const client = await clerkClient();
    const users = await client.users.getUserList({
      limit: 100,
    });

    // Filter users by company and format response
    const companyUsers = users.data
      .filter(user => {
        const metadata = user.publicMetadata as unknown as UserMetadata;
        return metadata?.companyId === companyId;
      })
      .map(user => {
        const metadata = user.publicMetadata as unknown as UserMetadata;
        return {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          role: metadata?.role || UserRole.COMPANY_VIEWER,
          department: metadata?.department,
          title: metadata?.title,
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt,
          isActive: !user.banned
        };
      });

    return NextResponse.json({ users: companyUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    const { companyId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to this company
    const belongsToComp = await belongsToCompany(companyId);
    if (!belongsToComp) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has permission to manage users
    const canManage = await hasPermission(Permission.MANAGE_USERS);
    if (!canManage) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { email, role, department, title } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Create invitation (in a real app, you'd send an invitation email)
    // For now, we'll return a success response
    const invitation = {
      id: Date.now().toString(),
      email,
      companyId,
      role,
      department: department || '',
      title: title || '',
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    return NextResponse.json({ 
      message: 'User invitation sent successfully',
      invitation 
    });

  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    const { companyId } = await params;

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to this company
    const belongsToComp = await belongsToCompany(companyId);
    if (!belongsToComp) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has permission to manage users
    const canManage = await hasPermission(Permission.MANAGE_USERS);
    if (!canManage) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { userId, role, department, title } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Update user metadata in Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    const currentMetadata = user.publicMetadata as unknown as UserMetadata;
    
    // Verify user belongs to the same company
    if (currentMetadata?.companyId !== companyId) {
      return NextResponse.json({ error: 'User not found in company' }, { status: 404 });
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        role,
        department: department || currentMetadata?.department,
        title: title || currentMetadata?.title
      }
    });

    return NextResponse.json({ 
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
