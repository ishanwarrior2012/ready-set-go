import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization, AppRole } from "@/hooks/useAuthorization";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
  requireAll?: boolean; // If true, user must have ALL roles. If false, user needs ANY of the roles.
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requireAll = false,
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useAuthorization();
  const location = useLocation();

  // Show loading while checking auth state
  if (authLoading || rolesLoading) {
    return <LoadingPage />;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = requireAll
      ? requiredRoles.every((role) => roles.includes(role))
      : requiredRoles.some((role) => roles.includes(role));

    if (!hasRequiredRoles) {
      // User doesn't have required roles - redirect to dashboard with message
      return <Navigate to="/" state={{ unauthorized: true }} replace />;
    }
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      {children}
    </ProtectedRoute>
  );
}

export function ModeratorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "moderator"]}>
      {children}
    </ProtectedRoute>
  );
}
