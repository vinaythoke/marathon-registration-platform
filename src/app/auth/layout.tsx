import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication pages for Marathon Registration',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen h-screen flex flex-col">
      {/* Global loading indicator for page transitions */}
      <LoadingIndicator />
      
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        <div className="relative hidden lg:flex lg:w-1/2 bg-muted text-white h-full">
          <div className="absolute inset-0 bg-zinc-900">
            <Image
              src="/images/auth-bg.webp"
              alt="Authentication background"
              fill
              className="object-cover opacity-25"
              priority // Add priority to improve loading speed
            />
          </div>
          <div className="relative z-20 flex items-center text-lg font-medium p-10">
            <Link href="/">Marathon Registration</Link>
          </div>
          <div className="relative z-20 mt-auto p-10">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "Running is the greatest metaphor for life, because you get out of it what you put into it."
              </p>
              <footer className="text-sm">Oprah Winfrey</footer>
            </blockquote>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 lg:w-1/2">
          {children}
        </div>
      </div>
    </div>
  );
} 