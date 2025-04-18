import { ResetPasswordClientWrapper } from '@/components/auth/ResetPasswordClientWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | Marathon Registration',
  description: 'Reset your password',
};

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we will send you a password reset link
          </p>
        </div>
        <ResetPasswordClientWrapper />
      </div>
    </div>
  );
} 