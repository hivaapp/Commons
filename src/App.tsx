import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { router } from './router';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/auth';
import { useAuthProfile } from './hooks/useAuthProfile';
import { ToastProvider } from './components/ui/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

function AuthListener() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return null;
}

/** Fetches profile once user is authenticated */
function ProfileLoader() {
  useAuthProfile();
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthListener />
          <ProfileLoader />
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
