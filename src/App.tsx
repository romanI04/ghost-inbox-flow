import { useState, useEffect } from "react";
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

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status and theme on app load
  useEffect(() => {
    const checkAuth = () => {
      // In real implementation, check Supabase session
      // const { data: { session } } = await supabase.auth.getSession();
      
      const savedAuth = localStorage.getItem('inghost_authenticated');
      setIsAuthenticated(savedAuth === 'true');
      
      const savedTheme = localStorage.getItem('inghost_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('inghost_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('inghost_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('inghost_authenticated');
    // In real implementation: await supabase.auth.signOut();
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
                    <Login />
                  )
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  isAuthenticated ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/settings" 
                element={
                  isAuthenticated ? (
                    <Settings />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
