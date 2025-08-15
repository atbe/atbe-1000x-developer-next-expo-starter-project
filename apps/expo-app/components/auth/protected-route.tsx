import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import type { UserRole } from "@starterp/models";
import { hasRole } from "../../utils/auth-utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  requiredRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, token, hasHydrated, user } = useAuthStore();

  // Show loading spinner while hydrating
  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !token) {
    return <Redirect href={redirectTo} />;
  }

  // Check for required roles if specified
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => hasRole(user, role));

    if (!hasRequiredRole) {
      // Redirect to dashboard or another appropriate page if user doesn't have required role
      return <Redirect href="/dashboard" />;
    }
  }

  return <>{children}</>;
}
