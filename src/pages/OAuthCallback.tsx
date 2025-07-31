import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const oauthStatus = searchParams.get('oauth');
    const error = searchParams.get('error');
    
    if (oauthStatus === 'success') {
      setStatus('success');
      setMessage('Successfully connected your Google account!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else if (error) {
      setStatus('error');
      setMessage(`Authentication failed: ${error}`);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setStatus('error');
      setMessage('Unknown authentication status');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 rounded-lg bg-card shadow-lg max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Processing...</h1>
            <p className="text-muted-foreground">Completing your authentication</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
            <h1 className="text-2xl font-bold text-green-600">Success!</h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
            <h1 className="text-2xl font-bold text-red-600">Authentication Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback; 