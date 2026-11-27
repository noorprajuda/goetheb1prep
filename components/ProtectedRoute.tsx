'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if user is on public pages
    const publicPages = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/email-verification-success', '/email-sent', '/subscription/success'];
    if (!isLoading && !user && !publicPages.includes(pathname)) {
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Allow access to public pages even without authentication
  const publicPages = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/email-verification-success', '/email-sent', '/subscription/success'];
  if (!user && publicPages.includes(pathname)) {
    return <>{children}</>;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
