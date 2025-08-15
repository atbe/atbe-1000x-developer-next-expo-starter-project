import type { UserInfo, UserRole, FrontendUser } from "@starterp/models";

/**
 * Extract roles from GoTrue user info.
 * Roles are stored in app_metadata.roles array.
 */
export function extractRolesFromUserInfo(
  userInfo: UserInfo | null
): UserRole[] {
  if (!userInfo?.user?.app_metadata?.roles) {
    return [];
  }

  // Filter to only valid roles
  const validRoles: UserRole[] = ["user", "admin"];
  return userInfo.user.app_metadata.roles.filter((role): role is UserRole =>
    validRoles.includes(role as UserRole)
  );
}

/**
 * Extract user display name from GoTrue user info.
 * Tries multiple sources in order of preference.
 */
export function extractUserDisplayName(userInfo: UserInfo | null): {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
} {
  if (!userInfo?.user) {
    return { firstName: null, lastName: null, fullName: null };
  }

  // Try user_metadata first (OAuth providers often populate this)
  const metadata = userInfo.user.user_metadata;
  if (metadata?.full_name || metadata?.name) {
    const fullName = metadata.full_name || metadata.name || null;
    const parts = fullName?.split(" ") || [];
    return {
      firstName: parts[0] || null,
      lastName: parts.slice(1).join(" ") || null,
      fullName,
    };
  }

  // Fall back to email username
  const emailName = userInfo.user.email?.split("@")[0] || null;
  return {
    firstName: emailName,
    lastName: null,
    fullName: emailName,
  };
}

/**
 * Convert GoTrue UserInfo to FrontendUser format.
 * Centralizes the transformation logic.
 */
export function userInfoToFrontendUser(userInfo: UserInfo): FrontendUser {
  const { firstName, lastName, fullName } = extractUserDisplayName(userInfo);
  const roles = extractRolesFromUserInfo(userInfo);

  return {
    id: userInfo.user.id,
    email: userInfo.user.email,
    firstName,
    lastName,
    name: fullName || undefined,
    roles,
  };
}

/**
 * Check if user has admin role.
 */
export function isAdmin(user: { roles?: UserRole[] } | null): boolean {
  return user?.roles?.includes("admin") || false;
}

/**
 * Check if user has a specific role.
 */
export function hasRole(
  user: { roles?: UserRole[] } | null,
  role: UserRole
): boolean {
  return user?.roles?.includes(role) || false;
}
