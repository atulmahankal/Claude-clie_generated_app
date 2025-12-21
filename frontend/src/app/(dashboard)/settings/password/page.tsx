import { ChangePasswordForm } from '@/components/settings/change-password-form';

export default function PasswordSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Change Password</h3>
        <p className="text-sm text-muted-foreground">
          Update your password and secure your account
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
