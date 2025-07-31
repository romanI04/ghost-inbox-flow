import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Navigation from "./components/navigation/Navigation";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/OAuthCallback";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey); // Export for use in other files

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry failed fetches once
      staleTime: 1000 * 60, // 1 minute cache
    },
  },
});

const App = () => {
  const [session, setSession] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Session error:', error);
      setSession(session);
      
      // Check if we need to capture Gmail tokens after Supabase OAuth
      const urlParams = new URLSearchParams(window.location.search);
      if (session && urlParams.get('gmail_auth') === 'needed') {
        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
        // Trigger Gmail token capture
        captureGmailTokens(session.user.id);
        return;
      }
      
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Check if we need to capture Gmail tokens after Supabase OAuth
      const urlParams = new URLSearchParams(window.location.search);
      if (session && urlParams.get('gmail_auth') === 'needed') {
        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
        // Trigger Gmail token capture
        captureGmailTokens(session.user.id);
      }
    });

    const savedTheme = localStorage.getItem('inghost_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('inghost_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleLogin = async () => {
    try {
      // Authenticate with Supabase to create/login user
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}?gmail_auth=needed`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        },
      });
      
      if (error) {
        console.error('Login error:', error.message);
        return;
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const captureGmailTokens = async (userId: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/capture-google-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();
      if (data.auth_url) {
        // Redirect to Google OAuth for Gmail tokens
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error capturing Gmail tokens:', error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
    setSession(null);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-lg font-medium text-foreground">Loading Inghost...</span>
        </div>
      </div>
    );
  }

  const isAuthenticated = !!session;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            {isAuthenticated && (
              <Navigation 
                onLogout={handleLogout}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
            <Routes>
              <Route 
                path="/" 
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  isAuthenticated ? (
                    <Dashboard session={session} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/settings" 
                element={
                  isAuthenticated ? (
                    <Settings session={session} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route path="/oauth-callback" element={<OAuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;