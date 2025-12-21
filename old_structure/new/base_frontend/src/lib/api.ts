/**
 * API Client for Backend Integration
 *
 * This file provides a clean interface for making API calls to your backend.
 * Update the API_URL and implement the actual fetch calls when integrating with your backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.message || 'API request failed')
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred')
  }
}

/**
 * API client with organized endpoints
 */
export const api = {
  auth: {
    /**
     * Register a new user
     */
    register: async (data: {
      firstName: string
      lastName: string
      email: string
      password: string
    }) => {
      return fetchAPI('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    /**
     * Login with email and password
     */
    login: async (credentials: { email: string; password: string }) => {
      return fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
    },

    /**
     * Request password reset email
     */
    forgotPassword: async (email: string) => {
      return fetchAPI('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    },

    /**
     * Reset password with token
     */
    resetPassword: async (token: string, password: string) => {
      return fetchAPI('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
    },

    /**
     * Get current user profile
     */
    getProfile: async () => {
      return fetchAPI('/api/auth/profile', {
        method: 'GET',
      })
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: {
      firstName: string
      lastName: string
      email: string
      phone?: string
    }) => {
      return fetchAPI('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },

    /**
     * Change user password
     */
    changePassword: async (data: {
      currentPassword: string
      newPassword: string
    }) => {
      return fetchAPI('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    /**
     * Logout (clear local token)
     */
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
    },
  },

  // Add more API groups as needed
  // Example:
  // users: {
  //   list: () => fetchAPI('/api/users'),
  //   get: (id: string) => fetchAPI(`/api/users/${id}`),
  //   create: (data: any) => fetchAPI('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  //   update: (id: string, data: any) => fetchAPI(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  //   delete: (id: string) => fetchAPI(`/api/users/${id}`, { method: 'DELETE' }),
  // },
}

/**
 * Example usage in a component:
 *
 * import { api } from '@/lib/api'
 *
 * const handleLogin = async () => {
 *   try {
 *     const response = await api.auth.login({ email, password })
 *     localStorage.setItem('token', response.token)
 *     router.push('/dashboard')
 *   } catch (error) {
 *     console.error('Login failed:', error)
 *   }
 * }
 */
