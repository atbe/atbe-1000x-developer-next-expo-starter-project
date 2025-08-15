import type { UserRole } from '@starterp/models';

export function parseRolesFromToken(accessToken: string): UserRole[] {
  try {
    const tokenParts = accessToken.split('.');
    if (tokenParts.length !== 3) return [];
    
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Check for roles in custom claims namespace (GoTrue format)
    const customClaims = payload['https://just-talk.io/jwt/claims'];
    if (customClaims?.roles && Array.isArray(customClaims.roles)) {
      return customClaims.roles.filter(
        (role: string): role is UserRole => role === 'user' || role === 'admin'
      );
    }
    
    // Fallback to app_metadata.roles
    if (payload.app_metadata?.roles && Array.isArray(payload.app_metadata.roles)) {
      return payload.app_metadata.roles.filter(
        (role: string): role is UserRole => role === 'user' || role === 'admin'
      );
    }
    
    // Fallback to single role for backward compatibility
    if (payload.app_metadata?.role) {
      const role = payload.app_metadata.role;
      if (role === 'user' || role === 'admin') {
        return [role as UserRole];
      }
    }
    
    return [];
  } catch {
    return [];
  }
}

export function parseRolesFromUser(user: any): UserRole[] {
  // Check app_metadata.roles
  if (user.app_metadata?.roles && Array.isArray(user.app_metadata.roles)) {
    const validRoles = user.app_metadata.roles.filter(
      (role: string): role is UserRole => role === 'user' || role === 'admin'
    );
    return validRoles.length > 0 ? validRoles : [];
  }
  
  // Fallback to single role
  if (user.app_metadata?.role) {
    const role = user.app_metadata.role;
    if (role === 'user' || role === 'admin') {
      return [role as UserRole];
    }
  }
  
  return [];
}