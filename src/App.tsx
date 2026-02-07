import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/hooks/useAuth";
import { lazy, Suspense, useEffect } from "react";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AuthGuard, GuestGuard } from "@/components/auth/AuthGuard";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Flights = lazy(() => import("./pages/Flights"));
const Marine = lazy(() => import("./pages/Marine"));
const Earthquakes = lazy(() => import("./pages/Earthquakes"));
const Volcanoes = lazy(() => import("./pages/Volcanoes"));
const ISS = lazy(() => import("./pages/ISS"));
const Tsunami = lazy(() => import("./pages/Tsunami"));
const Chill = lazy(() => import("./pages/Chill"));
const Weather = lazy(() => import("./pages/Weather"));
const RadioPage = lazy(() => import("./pages/Radio"));
const SearchPage = lazy(() => import("./pages/Search"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AuthPage = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Register service worker for PWA
function useServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => {
            // Service worker registered successfully - no logging in production
          })
          .catch(() => {
            // Service worker registration failed - no logging in production
          });
      });
    }
  }, []);
}

const App = () => {
  useServiceWorker();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <TooltipProvider>
                <OfflineIndicator />
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Suspense fallback={<LoadingPage />}>
                    <Routes>
                      {/* Auth page - only for guests */}
                      <Route path="/auth" element={<GuestGuard><AuthPage /></GuestGuard>} />
                      
                      {/* Protected routes - require authentication */}
                      <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
                      <Route path="/flights" element={<AuthGuard><Flights /></AuthGuard>} />
                      <Route path="/marine" element={<AuthGuard><Marine /></AuthGuard>} />
                      <Route path="/earthquakes" element={<AuthGuard><Earthquakes /></AuthGuard>} />
                      <Route path="/volcanoes" element={<AuthGuard><Volcanoes /></AuthGuard>} />
                      <Route path="/iss" element={<AuthGuard><ISS /></AuthGuard>} />
                      <Route path="/tsunami" element={<AuthGuard><Tsunami /></AuthGuard>} />
                      <Route path="/chill" element={<AuthGuard><Chill /></AuthGuard>} />
                      <Route path="/weather" element={<AuthGuard><Weather /></AuthGuard>} />
                      <Route path="/radio" element={<AuthGuard><RadioPage /></AuthGuard>} />
                      <Route path="/search" element={<AuthGuard><SearchPage /></AuthGuard>} />
                      <Route path="/favorites" element={<AuthGuard><Favorites /></AuthGuard>} />
                      <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                      <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                      <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;