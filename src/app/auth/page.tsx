import { redirect } from 'next/navigation';

export default function AuthPage() {
  // This will never be rendered in practice because of middleware
  // but adding as a fallback just in case
  redirect('/auth/login');
} 