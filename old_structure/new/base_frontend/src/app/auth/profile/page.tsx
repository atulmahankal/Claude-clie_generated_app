'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { checkPasswordStrength } from '@/lib/utils'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    color: '',
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))

    if (name === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value))
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setSuccessMessage('')

    // Validation
    const newErrors: Record<string, string> = {}
    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!profileData.email) {
      newErrors.email = 'Email is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileData),
      // })

      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccessMessage('Profile updated successfully!')
    } catch (error) {
      setErrors({ submit: 'Failed to update profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setSuccessMessage('')

    // Validation
    const newErrors: Record<string, string> = {}
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/change-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(passwordData),
      // })

      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccessMessage('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      setErrors({ submit: 'Failed to change password' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg"></div>
            <span className="text-xl font-bold">App</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'password'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Change Password
                </button>
              </nav>
            </div>

            <div className="p-6">
              {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {successMessage}
                </div>
              )}

              {errors.submit && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {errors.submit}
                </div>
              )}

              {/* Profile Form */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="First name"
                      name="firstName"
                      type="text"
                      required
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      error={errors.firstName}
                    />

                    <Input
                      label="Last name"
                      name="lastName"
                      type="text"
                      required
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      error={errors.lastName}
                    />
                  </div>

                  <Input
                    label="Email address"
                    name="email"
                    type="email"
                    required
                    value={profileData.email}
                    onChange={handleProfileChange}
                    error={errors.email}
                    helperText="Your email address is used for login and notifications"
                  />

                  <Input
                    label="Phone number"
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    error={errors.phone}
                    helperText="Optional: Used for account recovery"
                  />

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Password Form */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        label="Current password"
                        name="currentPassword"
                        type={showPasswords ? 'text' : 'password'}
                        required
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        error={errors.currentPassword}
                      />
                    </div>

                    <div>
                      <div className="relative">
                        <Input
                          label="New password"
                          name="newPassword"
                          type={showPasswords ? 'text' : 'password'}
                          required
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          error={errors.newPassword}
                          helperText="Must be at least 8 characters with uppercase, lowercase, numbers, and symbols"
                        />
                      </div>
                      {passwordData.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  passwordStrength.score === 0
                                    ? 'w-0'
                                    : passwordStrength.score === 1
                                    ? 'w-1/4 bg-red-500'
                                    : passwordStrength.score === 2
                                    ? 'w-2/4 bg-orange-500'
                                    : passwordStrength.score === 3
                                    ? 'w-3/4 bg-yellow-500'
                                    : 'w-full bg-green-500'
                                }`}
                              />
                            </div>
                            <span className={`text-sm ${passwordStrength.color}`}>
                              {passwordStrength.feedback}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Input
                      label="Confirm new password"
                      name="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      error={errors.confirmPassword}
                    />

                    <div className="flex items-center">
                      <input
                        id="show-passwords"
                        type="checkbox"
                        checked={showPasswords}
                        onChange={(e) => setShowPasswords(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="show-passwords" className="ml-2 block text-sm text-gray-900">
                        Show passwords
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                      setErrors({})
                    }}>
                      Clear
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
