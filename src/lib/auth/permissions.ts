import { auth } from '@clerk/nextjs/server';
import { UserRole, Permission, ROLE_PERMISSIONS, UserMetadata } from '../types/auth';

/**
 * Get user metadata from Clerk
 */
export async function getUserMetadata(): Promise<UserMetadata | null> {
  const { userId, sessionClaims } = await auth();
  
  if (!userId || !sessionClaims) {
    return null;
  }

  // Get metadata from Clerk's public metadata
  const metadata = sessionClaims.metadata as UserMetadata;
  
  if (!metadata?.companyId || !metadata?.role) {
    return null;
  }

  return {
    companyId: metadata.companyId,
    role: metadata.role,
    permissions: ROLE_PERMISSIONS[metadata.role] || [],
    department: metadata.department,
    title: metadata.title
  };
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const metadata = await getUserMetadata();
  
  if (!metadata) {
    return false;
  }

  return metadata.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const metadata = await getUserMetadata();
  
  if (!metadata) {
    return false;
  }

  return permissions.some(permission => metadata.permissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const metadata = await getUserMetadata();
  
  if (!metadata) {
    return false;
  }

  return permissions.every(permission => metadata.permissions.includes(permission));
}

/**
 * Check if user belongs to a specific company
 */
export async function belongsToCompany(companyId: string): Promise<boolean> {
  const metadata = await getUserMetadata();
  
  if (!metadata) {
    return false;
  }

  return metadata.companyId === companyId;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const metadata = await getUserMetadata();
  
  if (!metadata) {
    return false;
  }

  return metadata.role === role;
}

/**
 * Check if user is a company admin or higher
 */
export async function isCompanyAdmin(): Promise<boolean> {
  const metadata = await getUserMetadata();
  
  if (!metadata) {
    return false;
  }

  return [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN].includes(metadata.role);
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const metadata = await getUserMetadata();
  
  if (!metadata) {
    return false;
  }

  return metadata.role === UserRole.SUPER_ADMIN;
}

/**
 * Get user's company ID
 */
export async function getUserCompanyId(): Promise<string | null> {
  const metadata = await getUserMetadata();
  return metadata?.companyId || null;
}
