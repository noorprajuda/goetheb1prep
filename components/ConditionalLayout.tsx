'use client';

import { usePathname } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProtectedRoute from './ProtectedRoute';
import Sidebar from './ui/SideBar';
import { Menu } from 'lucide-react';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  // const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Measure and expose mobile header height as CSS variable for responsive height calculations
  useEffect(() => {
    const setHeaderHeightVar = () => {
      const header = document.querySelector<HTMLElement>('header.mobile-header');
      if (header) {
        const heightPx = `${header.offsetHeight}px`;
        document.documentElement.style.setProperty('--mobile-header-h', heightPx);
      }
    };

    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);
    
    // Only run interval briefly to handle dynamic content changes, then stop
    const intervalId = window.setInterval(setHeaderHeightVar, 100);
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 2000); // Stop after 2 seconds

    return () => {
      window.removeEventListener('resize', setHeaderHeightVar);
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);


  // If it's a public page or API route, render without protection and sidebar
  const publicPages = ['/login', '/register', '/privacy-policy', '/forgot-password', '/reset-password', '/verify-email', '/email-verification-success', '/email-sent', '/confirm-email'];
  const isApiRoute = pathname.startsWith('/api/');
  
  if (publicPages.includes(pathname) || isApiRoute) {
    return <>{children}</>;
  }

  // If it's the home page, render with sidebar (but no protection)
  if (pathname === '/') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="lg:ml-64 flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="mobile-header bg-white border-b border-slate-200 px-4 py-3 lg:hidden sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image 
                  src="/favicon.ico" 
                  alt="Goethe B1 Prep Logo" 
                  className="w-6 h-6"
                  width={24}
                  height={24}
                />
                <h1 className="text-lg font-bold text-slate-900">Goethe B1 Prep</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // For all other pages, use protected route with sidebar
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="lg:ml-64 flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="mobile-header bg-white border-b border-slate-200 px-4 py-3 lg:hidden sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image 
                  src="/favicon.ico" 
                  alt="Goethe B1 Prep Logo" 
                  className="w-6 h-6"
                  width={24}
                  height={24}
                />
                <h1 className="text-lg font-bold text-slate-900">Goethe B1 Prep</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
