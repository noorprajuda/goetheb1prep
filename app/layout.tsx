import React from "react";
import ClientI18nProvider from "@/components/ClientI18nProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ConditionalLayout from "../components/ConditionalLayout";
import "./globals.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Goethe B1 Prep - AI-Powered German Speaking Test Simulator | Free Practice',
    template: '%s | Goethe B1 Prep'
  },
  description: 'Master German speaking skills with our AI-powered Goethe B1 exam simulator. Practice authentic B1 speaking tasks, get instant feedback, and boost your confidence for the Goethe Zertifikat B1 exam. Free trial available!',
  keywords: [
    'Goethe B1',
    'German speaking test',
    'B1 exam preparation',
    'German language learning',
    'Goethe Zertifikat',
    'AI feedback',
    'speaking practice',
    'German conversation',
    'B1 simulator',
    'German exam prep',
    'language learning app',
    'German speaking skills',
    'Goethe B1 speaking practice online',
    'AI German speaking test simulator',
    'Goethe Zertifikat B1 preparation',
    'German B1 exam speaking practice',
    'Goethe B1 prep Indonesia',
    'German B1 exam practice Jakarta',
    'Goethe B1 simulator Indonesia',
    'German language exam preparation',
    'B1 speaking test practice',
    'German conversation practice',
    'Goethe exam simulator',
    'German speaking assessment',
    'B1 level German practice'
  ],
  authors: [{ name: 'Goethe B1 Prep Team' }],
  creator: 'Goethe B1 Prep',
  publisher: 'Goethe B1 Prep',
  applicationName: 'Goethe B1 Prep',
  category: 'Education',
  classification: 'Educational Technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.goetheb1prep.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'id': '/id',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.goetheb1prep.com',
    siteName: 'Goethe B1 Prep',
    title: 'Goethe B1 Prep - AI-Powered German Speaking Test Simulator | Free Practice',
    description: 'Master German speaking skills with our AI-powered Goethe B1 exam simulator. Practice authentic B1 speaking tasks, get instant feedback, and boost your confidence for the Goethe Zertifikat B1 exam.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Goethe B1 Prep - German Speaking Test Simulator - AI-Powered Practice Platform',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@goetheb1prep',
    creator: '@goetheb1prep',
    title: 'Goethe B1 Prep - AI-Powered German Speaking Test Simulator',
    description: 'Master German speaking skills with our AI-powered Goethe B1 exam simulator. Practice authentic B1 speaking tasks and get instant feedback.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Goethe B1 Prep',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Google Analytics */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'}', {
                send_page_view: true,
                anonymize_ip: true,
                allow_google_signals: true,
                allow_ad_personalization_signals: false,
                cookie_flags: 'SameSite=None;Secure',
              });
            `,
          }}
        />

        {/* Enhanced Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "Goethe B1 Prep",
              "alternateName": "Goethe B1 Speaking Test Simulator",
              "description": "AI-powered German speaking test simulator for Goethe B1 exam preparation. Practice authentic B1 speaking tasks, get instant feedback, and boost your confidence for the Goethe Zertifikat B1 exam.",
              "url": "https://www.goetheb1prep.com",
              "logo": "https://www.goetheb1prep.com/logo.png",
              "image": "https://www.goetheb1prep.com/og-image.jpg",
              "sameAs": [
                "https://www.facebook.com/goetheb1prep",
                "https://www.instagram.com/goetheb1prep",
                "https://twitter.com/goetheb1prep",
                "https://www.tiktok.com/@goetheb1prep"
              ],
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "ID"
              },
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Free Trial - Goethe B1 Speaking Test Simulator",
                  "description": "Free AI-powered practice platform for German B1 speaking exam",
                  "price": "0",
                  "priceCurrency": "EUR",
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01"
                },
                {
                  "@type": "Offer",
                  "name": "Premium Goethe B1 Prep Subscription",
                  "description": "Full access to AI-powered German B1 speaking practice with detailed feedback",
                  "price": "7.99",
                  "priceCurrency": "EUR",
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01"
                }
              ],
              "educationalUse": "practice",
              "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "German language learners"
              },
              "teaches": "German language speaking skills",
              "educationalLevel": "B1",
              "inLanguage": ["en", "id"],
              "keywords": "Goethe B1, German speaking test, B1 exam preparation, German language learning, AI feedback, speaking practice",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "softwareVersion": "1.0",
              "datePublished": "2024-01-01",
              "dateModified": "2025-01-26"
            })
          }}
        />
        
        {/* Course Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              "name": "Goethe B1 Speaking Test Preparation",
              "description": "Comprehensive AI-powered course for preparing for the Goethe B1 speaking exam with authentic practice tasks and detailed feedback",
              "provider": {
                "@type": "EducationalOrganization",
                "name": "Goethe B1 Prep",
                "url": "https://www.goetheb1prep.com"
              },
              "courseCode": "GOETHE-B1-SPEAKING",
              "educationalLevel": "B1",
              "inLanguage": ["en", "id"],
              "teaches": "German speaking skills for B1 level",
              "coursePrerequisites": "Basic German language knowledge (A2 level recommended)",
              "educationalCredentialAwarded": "Practice certificate",
              "timeRequired": "PT30M",
              "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "instructor": {
                  "@type": "Person",
                  "name": "AI Tutor"
                }
              }
            })
          }}
        />
        
        {/* Software Application Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Goethe B1 Prep",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "description": "AI-powered German speaking test simulator for Goethe B1 exam preparation",
              "url": "https://www.goetheb1prep.com",
              "author": {
                "@type": "Organization",
                "name": "Goethe B1 Prep Team"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150",
                "bestRating": "5",
                "worstRating": "1"
              },
              "screenshot": "https://www.goetheb1prep.com/og-image.jpg"
            })
          }}
        />
      </head>
      <body>
        <ClientI18nProvider>
          <AuthProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AuthProvider>
        </ClientI18nProvider>
      </body>
    </html>
  );
}