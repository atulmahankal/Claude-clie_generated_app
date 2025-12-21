// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface UpdateProfileData {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// API Error types
export interface APIError {
  message: string
  errors?: Record<string, string[]>
  statusCode?: number
}

// Form types
export interface FormErrors {
  [key: string]: string
}
