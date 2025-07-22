import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, CheckCircle, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Placeholder for Supabase Google OAuth
      // In real implementation, this would be:
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: 'google',
      //   options: {
      //     scopes: 'https://www.googleapis.com/auth/gmail.modify'
      //   }
      // });
      
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Welcome to Inghost!",
        description: "You've been successfully logged in.",
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: CheckCircle,
      title: "Smart Triage",
      description: "AI-powered email categorization and prioritization"
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "OAuth 2.0 with minimal Gmail permissions"
    },
    {
      icon: Zap,
      title: "Automation First",
      description: "Reduce email overhead with intelligent automation"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gradient-bg relative overflow-hidden">
      {/* Gradient overlay for better readability */}
      <div className="absolute inset-0 gradient-overlay opacity-95" />
      {/* Left Panel - Hero Section */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent glow-effect">
                <span className="text-lg font-bold text-primary-foreground">I</span>
              </div>
              <h1 className="gradient-text text-3xl font-bold tracking-tight">
                Inghost
              </h1>
            </div>
            
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Your AI Email Assistant
            </h2>
            <p className="text-lg text-muted-foreground">
              Automate Gmail triage with intelligent categorization, 
              draft generation, and smart notifications.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-4 rounded-lg glass-card hover-lift"
              >
                <div className="flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="max-w-sm w-full">
          <Card className="glass-card border-0 shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in with your Google account to continue
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary smooth-transition glow-effect"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Continue with Google</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <a href="#" className="underline hover:text-primary smooth-transition">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline hover:text-primary smooth-transition">
                    Privacy Policy
                  </a>
                </p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Secure OAuth 2.0 authentication with minimal Gmail permissions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;