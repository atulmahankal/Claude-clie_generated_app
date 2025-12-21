'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const verifyCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
});

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const hasAutoVerified = useRef(false);

  const verifyForm = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      email: searchParams?.get('email') || '',
      code: searchParams?.get('code') || '',
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Auto-verify code if both email and code are provided in URL
  useEffect(() => {
    const email = searchParams?.get('email');
    const code = searchParams?.get('code');

    if (email && code && step === 'verify' && !hasAutoVerified.current && !isLoading) {
      hasAutoVerified.current = true;

      // Inline auto-verification to avoid dependency issues
      setIsLoading(true);
      setError(null);

      fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || 'Failed to verify code');
          }
          return result;
        })
        .then((result) => {
          setResetToken(result.resetToken);
          setStep('reset');
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to verify code');
          hasAutoVerified.current = false; // Allow retry
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [searchParams, step, isLoading]);

  async function onVerifySubmit(data: VerifyCodeFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify code');
      }

      setResetToken(result.resetToken);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetSubmit(data: ResetPasswordFormValues) {
    if (!resetToken) {
      setError('No reset token found. Please verify your code first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Password reset successful</CardTitle>
          <CardDescription className="text-center">
            Your password has been changed. All other devices have been logged out for security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Continue to login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'reset') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create new password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          {...field}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters with uppercase, lowercase, number, and special character
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          {...field}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  'Reset password'
                )}
              </Button>

              <div className="text-center mt-4">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // Show loading state during auto-verification
  if (isLoading && hasAutoVerified.current && step === 'verify') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying your reset code...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Enter reset code</CardTitle>
        <CardDescription className="text-center">
          Enter the 6-digit code sent to your email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...verifyForm}>
          <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={verifyForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={verifyForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      {...field}
                      disabled={isLoading}
                      className="text-center text-2xl tracking-widest"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the 6-digit code from your email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify code'
              )}
            </Button>

            <div className="text-center space-y-2">
              <Link
                href="/forgot-password"
                className="block text-sm text-muted-foreground hover:text-primary"
              >
                Didn't receive a code? Send again
              </Link>
              <Link
                href="/login"
                className="block text-sm text-muted-foreground hover:text-primary"
              >
                Back to login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
