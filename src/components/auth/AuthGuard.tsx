import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * AuthGuard component that redirects unauthenticated users to the auth page.
 * Use this to wrap pages that require authentication.
 */
export function AuthGuard({ children, fallbackPath = "/auth" }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate(fallbackPath, { state: { from: location }, replace: true });
    }
  }, [user, loading, navigate, fallbackPath, location]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

/**
 * GuestGuard component that redirects authenticated users away from auth pages.
 * Use this to wrap pages that should only be accessible to unauthenticated users.
 */
export function GuestGuard({ children, redirectPath = "/" }: { children: React.ReactNode; redirectPath?: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to the page they came from, or default to dashboard
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || redirectPath;
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, redirectPath, location]);

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
