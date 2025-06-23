import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      // Handle OAuth errors
      let errorMessage = 'Authentication failed. Please try again.';
      
      switch (error) {
        case 'oauth_failed':
          errorMessage = 'Google authentication failed. Please try again.';
          break;
        case 'oauth_callback_failed':
          errorMessage = 'Authentication callback failed. Please try again.';
          break;
        default:
          errorMessage = 'Authentication error. Please try again.';
      }
      
      navigate('/login', { 
        state: { error: errorMessage } 
      });
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store authentication data
        login(user, token);
        
        // Redirect to home page
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Error parsing user data:', err);
        navigate('/login', { 
          state: { error: 'Authentication data error. Please try again.' } 
        });
      }
    } else {
      // Missing required parameters
      navigate('/login', { 
        state: { error: 'Authentication incomplete. Please try again.' } 
      });
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-lg">Completing authentication...</p>
        <p className="text-sm text-muted-foreground">Please wait while we sign you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;

