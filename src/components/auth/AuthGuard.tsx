import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Validates that a redirect path is safe (internal, relative path only).
 */
function isValidRedirectPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (path.includes(':')) return false;
  const decoded = decodeURIComponent(path);
  if (decoded.startsWith('//') || decoded.includes(':')) return false;
  return true;
}

/**
 * AuthGuard: Redirects unauthenticated users to /auth.
 * Also redirects new users (who haven't done onboarding) to /onboarding.
 */
export function AuthGuard({ children, fallbackPath = "/auth" }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate(fallbackPath, { state: { from: location }, replace: true });
      return;
    }
    // If user is logged in but hasn't completed onboarding, redirect there
    // (skip redirect if already on onboarding page)
    if (!loading && user && location.pathname !== "/onboarding") {
      const onboardingDone = localStorage.getItem(`onboarding_done_${user.id}`);
      if (!onboardingDone) {
        navigate("/onboarding", { replace: true });
      }
    }
  }, [user, loading, navigate, fallbackPath, location]);

  if (loading) return <LoadingPage />;
  if (!user) return null;

  // Don't render children if onboarding pending (avoid flash)
  if (location.pathname !== "/onboarding") {
    const onboardingDone = localStorage.getItem(`onboarding_done_${user.id}`);
    if (!onboardingDone) return null;
  }

  return <>{children}</>;
}

/**
 * GuestGuard: Redirects authenticated users away from auth pages.
 */
export function GuestGuard({ children, redirectPath = "/" }: { children: React.ReactNode; redirectPath?: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      const requestedPath = (location.state as { from?: { pathname: string } })?.from?.pathname || redirectPath;
      const safePath = isValidRedirectPath(requestedPath) ? requestedPath : redirectPath;
      navigate(safePath, { replace: true });
    }
  }, [user, loading, navigate, redirectPath, location]);

  if (loading) return <LoadingPage />;
  if (user) return null;
  return <>{children}</>;
}
