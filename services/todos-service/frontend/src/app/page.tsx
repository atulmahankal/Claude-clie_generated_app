'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@jam/shared-ui'
import { Shield, Key, Lock, Users } from 'lucide-react'

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Authentication Service
          </h1>
          <p className="text-lg text-gray-600">
            Manage your security settings and authentication methods
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Session Management</CardTitle>
                  <CardDescription>View and manage active sessions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                See all devices where you're logged in and revoke access when needed.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Enhanced security for your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Add an extra layer of security with 2FA using authenticator apps.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Password Security</CardTitle>
                  <CardDescription>Change or reset your password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Update your password regularly to keep your account secure.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage your display name, email, and other profile details.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
