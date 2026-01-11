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
 * Validates that a redirect path is safe (internal, relative path only).
 * Prevents open redirect attacks by rejecting external URLs and protocol-relative URLs.
 */
function isValidRedirectPath(path: string): boolean {
  // Must start with a single slash (not protocol-relative //)
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false;
  }
  
  // Block any path that contains protocol indicators
  if (path.includes(':')) {
    return false;
  }
  
  // Block encoded characters that could bypass checks
  const decoded = decodeURIComponent(path);
  if (decoded.startsWith('//') || decoded.includes(':')) {
    return false;
  }
  
  return true;
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
      const requestedPath = (location.state as { from?: { pathname: string } })?.from?.pathname || redirectPath;
      
      // Validate the redirect path to prevent open redirect attacks
      const safePath = isValidRedirectPath(requestedPath) ? requestedPath : redirectPath;
      navigate(safePath, { replace: true });
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
