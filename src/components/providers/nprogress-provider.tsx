'use client';

import { ClientProgress } from './client-progress';
import dynamic from 'next/dynamic';

// Load the navigation events component dynamically to avoid server-side rendering
const NavigationEvents = dynamic(
  () => import('./navigation-events').then(mod => mod.NavigationEvents),
  { ssr: false }
);

export function NProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientProgress />
      {children}
      <NavigationEvents />
    </>
  );
} 