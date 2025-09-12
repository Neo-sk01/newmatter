'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Permission, UserRole, UserMetadata } from '@/lib/types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  companyId?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRole,
  companyId,
  fallback
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (!user) {
      setHasAccess(false);
      return;
    }

    // Get user metadata from Clerk
    const metadata = user.publicMetadata as unknown as UserMetadata;

    if (!metadata?.companyId || !metadata?.role) {
      // User not properly set up, redirect to onboarding
      router.push('/onboarding');
      return;
    }

    // Check company access
    if (companyId && metadata.companyId !== companyId) {
      setHasAccess(false);
      return;
    }

    // Check role requirement
    if (requiredRole && metadata.role !== requiredRole) {
      // Check if user has higher privileges
      const roleHierarchy = {
        [UserRole.COMPANY_VIEWER]: 1,
        [UserRole.COMPANY_USER]: 2,
        [UserRole.COMPANY_ADMIN]: 3,
        [UserRole.SUPER_ADMIN]: 4
      };

      const userLevel = roleHierarchy[metadata.role];
      const requiredLevel = roleHierarchy[requiredRole];

      if (userLevel < requiredLevel) {
        setHasAccess(false);
        return;
      }
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const userPermissions = getUserPermissions(metadata.role);
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        setHasAccess(false);
        return;
      }
    }

    setHasAccess(true);
  }, [isLoaded, isSignedIn, user, companyId, requiredRole, requiredPermissions, router]);

  if (!isLoaded || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this resource.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function getUserPermissions(role: UserRole): Permission[] {
  const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_ADMIN]: Object.values(Permission),
    
    [UserRole.COMPANY_ADMIN]: [
      Permission.MANAGE_COMPANY,
      Permission.VIEW_COMPANY,
      Permission.MANAGE_USERS,
      Permission.VIEW_USERS,
      Permission.GENERATE_LEADS,
      Permission.VIEW_LEADS,
      Permission.EXPORT_LEADS,
      Permission.CREATE_CAMPAIGNS,
      Permission.SEND_CAMPAIGNS,
      Permission.VIEW_CAMPAIGNS,
      Permission.VIEW_ANALYTICS,
      Permission.EXPORT_ANALYTICS,
      Permission.MANAGE_PROMPTS,
      Permission.VIEW_PROMPTS,
      Permission.MANAGE_SETTINGS,
      Permission.VIEW_SETTINGS
    ],
    
    [UserRole.COMPANY_USER]: [
      Permission.VIEW_COMPANY,
      Permission.GENERATE_LEADS,
      Permission.VIEW_LEADS,
      Permission.EXPORT_LEADS,
      Permission.CREATE_CAMPAIGNS,
      Permission.SEND_CAMPAIGNS,
      Permission.VIEW_CAMPAIGNS,
      Permission.VIEW_ANALYTICS,
      Permission.VIEW_PROMPTS,
      Permission.VIEW_SETTINGS
    ],
    
    [UserRole.COMPANY_VIEWER]: [
      Permission.VIEW_COMPANY,
      Permission.VIEW_LEADS,
      Permission.VIEW_CAMPAIGNS,
      Permission.VIEW_ANALYTICS,
      Permission.VIEW_PROMPTS,
      Permission.VIEW_SETTINGS
    ]
  };

  return ROLE_PERMISSIONS[role] || [];
}
