import { AuthClientWrapper } from '@/components/auth/AuthClientWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Marathon Registration',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details below to create your account
          </p>
        </div>
        <AuthClientWrapper />
      </div>
    </div>
  );
} 