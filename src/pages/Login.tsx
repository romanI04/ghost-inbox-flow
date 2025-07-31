import { Button } from "@/components/ui/button";

const Login = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 rounded-lg bg-card shadow-lg">
        <h1 className="text-3xl font-bold text-foreground">Welcome to Inghost</h1>
        <p className="text-muted-foreground">Your automation-first email assistant. Sign in to get started.</p>
        <Button onClick={onLogin} variant="outline" className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
};

export default Login;