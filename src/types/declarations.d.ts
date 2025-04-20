import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// Augment the Result type from cookies() function to make TypeScript happy
declare module 'next/headers' {
  function cookies(): ReadonlyRequestCookies;
} 