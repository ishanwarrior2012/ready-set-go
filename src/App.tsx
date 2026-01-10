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

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Flights = lazy(() => import("./pages/Flights"));
const Marine = lazy(() => import("./pages/Marine"));
const Earthquakes = lazy(() => import("./pages/Earthquakes"));
const Volcanoes = lazy(() => import("./pages/Volcanoes"));
const ISS = lazy(() => import("./pages/ISS"));
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
          .then((registration) => {
            console.log("SW registered:", registration.scope);
          })
          .catch((error) => {
            console.log("SW registration failed:", error);
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
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/flights" element={<Flights />} />
                      <Route path="/marine" element={<Marine />} />
                      <Route path="/earthquakes" element={<Earthquakes />} />
                      <Route path="/volcanoes" element={<Volcanoes />} />
                      <Route path="/iss" element={<ISS />} />
                      <Route path="/weather" element={<Weather />} />
                      <Route path="/radio" element={<RadioPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/favorites" element={<Favorites />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/notifications" element={<Notifications />} />
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