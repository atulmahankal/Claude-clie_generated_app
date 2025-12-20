/**
 * Auth Hooks
 *
 * React Query hooks for authentication
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as authApi from '../api/auth';

const AUTH_QUERY_KEY = ['auth', 'user'];

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Update the user cache
        queryClient.setQueryData(AUTH_QUERY_KEY, data.user);

        toast.success('Logged in successfully!');

        // Redirect to dashboard
        router.push('/dashboard');
      } else if (data.requires_2fa) {
        toast.info('Please complete two-factor authentication');
        // TODO: Redirect to 2FA page when implemented
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });
}

/**
 * Signup mutation
 */
export function useSignup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Update the user cache
        queryClient.setQueryData(AUTH_QUERY_KEY, data.user);

        toast.success('Account created successfully!');

        // Redirect to dashboard
        router.push('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Signup failed');
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear the user cache
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();

      toast.success('Logged out successfully');

      // Redirect to login
      router.push('/login');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Logout failed');
    },
  });
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
