import { AuthClientWrapper } from '@/components/auth/AuthClientWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Marathon Registration',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
        </div>
        <AuthClientWrapper />
      </div>
    </div>
  );
} 