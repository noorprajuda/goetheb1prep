"use client";
import { Home, Mic, BarChart2, LogOut, Crown, X, FileText, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TranslatedText from "@/components/TranslatedText";
import Image from "next/image";

const navItems = [
  { labelKey: "sidebar.home", href: "/", icon: Home },
  { labelKey: "sidebar.sprechen", href: "/speaking", icon: Mic },
  { labelKey: "sidebar.schreiben", href: "/schreiben", icon: FileText },
  { labelKey: "sidebar.lesen", href: "/lesen", icon: BookOpen },
  { labelKey: "sidebar.results", href: "/results", icon: BarChart2 },
  { labelKey: "sidebar.subscription", href: "/subscription", icon: Crown },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <aside className="h-screen w-64 bg-white border-r flex flex-col">
      {/* Mobile Close Button */}
      <div className="lg:hidden flex justify-end p-4 border-b">
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Top Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3">
            <Image 
              src="/favicon.ico" 
              alt="Goethe B1 Prep Logo" 
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-600">
                <TranslatedText 
                  translationKey="sidebar.goethe_b1_prep" 
                  fallback="Goethe B1 Prep"
                />
              </h1>
              <p className="text-sm text-gray-500">
                <TranslatedText 
                  translationKey="sidebar.sprechen_simulator" 
                  fallback="Sprechen Simulator"
                />
              </p>
            </div>
          </div>
          
          {/* Language Switcher */}
          <div className="mt-4 flex items-center justify-end gap-3">
            {/* ID Label */}
            <span className={`text-xs font-semibold transition-colors duration-300 ${
              isClient && i18n.language === 'id' ? 'text-slate-900' : 'text-gray-400'
            }`}>
              ID
            </span>
            
            {/* Toggle Button */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id')}
              className="relative flex items-center bg-gray-200 rounded-full p-0.5 transition-all duration-300 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {/* Toggle Track */}
              <div className="relative w-12 h-4 bg-gray-200 rounded-full transition-colors duration-300">
                {/* Sliding Circle */}
                <div 
                  className={`absolute top-0 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                    isClient && i18n.language === 'en' ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
            
            {/* EN Label */}
            <span className={`text-xs font-semibold transition-colors duration-300 ${
              isClient && i18n.language === 'en' ? 'text-slate-900' : 'text-gray-400'
            }`}>
              EN
            </span>
          </div>
        </div>

        <nav className="mt-6">
          <ul className="space-y-1">
            {navItems.map(({ labelKey, href, icon: Icon }) => {
              const isActive = pathname === href;
              // For non-authenticated users, redirect protected pages to login (except speaking page which shows subscription gate)
              const linkHref = !user && href !== '/' && href !== '/speaking' ? '/login' : href;
              return (
                <li key={labelKey}>
                  <Link
                    href={linkHref}
                    onClick={() => onClose?.()}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition 
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Icon size={18} />
                    <TranslatedText 
                      translationKey={labelKey} 
                      fallback={labelKey.replace('sidebar.', '').replace('_', ' ')}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom Section - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t bg-white">
        <div className="rounded-lg bg-gray-50 p-3 text-center mb-3">
          <p className="text-xs text-gray-500">
            <TranslatedText 
              translationKey="sidebar.goethe_b1_prep" 
              fallback="Goethe B1 Prep"
            />
          </p>
          <p className="text-xs text-gray-400">
            <TranslatedText 
              translationKey="sidebar.prepare_with_confidence" 
              fallback="Prepare with confidence"
            />
          </p>
        </div>
        
        {/* User info and logout */}
        {user ? (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">{user.email}</p>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-red-600 transition-colors w-full"
            >
              <LogOut className="w-3 h-3" />
              <TranslatedText 
                translationKey="sidebar.logout" 
                fallback="Logout"
              />
            </button>
          </div>
        ) : (
          <div className="border-t pt-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors w-full"
            >
              <TranslatedText 
                translationKey="sidebar.login" 
                fallback="Login"
              />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
