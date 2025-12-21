/**
 * Auth API Client
 *
 * Wrapper functions for authentication API endpoints
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  requires_2fa?: boolean;
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Login failed');
  }

  return response.json();
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      display_name: data.displayName,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Signup failed');
  }

  return response.json();
}

/**
 * Logout current user
 */
export async function logout(): Promise<{ success: boolean }> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  return response.json();
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.success ? data.user : null;
}
