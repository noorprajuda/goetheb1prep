"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/hooks/useApi';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Crown, Star, Zap, RefreshCw } from 'lucide-react';
// import TranslatedText from '@/components/TranslatedText';
import LoadingCard from "@/components/shared/LoadingCard";

interface SubscriptionStatus {
  hasAccess: boolean;
  status: string;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: Date;
    currentPeriodStart?: Date;
    createdAt?: Date;
    cancelled?: boolean;
  };
  currentPeriodEnd?: Date;
  trialStartedAt?: Date;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const { apiCall } = useApi();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Initial load - only when user changes
  useEffect(() => {
    if (!user) return;
    
    const fetchSubscriptionStatus = async (forceRefresh = false) => {
      try {
        // Only add cache-busting for force refresh, otherwise use cached response
        const url = forceRefresh 
          ? `/api/subscription/status?t=${Date.now()}&force=true`
          : `/api/subscription/status`;
        
        console.log('Fetching subscription status with URL:', url);
        
        const response = await apiCall(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
          console.log('Subscription status fetched:', data);
          console.log('Subscription plan:', data.subscription?.plan);
          console.log('Current period end from API:', data.currentPeriodEnd);
          console.log('Formatted date:', new Date(data.currentPeriodEnd).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }));
        } else {
          console.error('Failed to fetch subscription status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user?.id, apiCall, user]); // Include all dependencies

  // Check for refresh parameter and refetch subscription status
  useEffect(() => {
    const refresh = searchParams.get('refresh');
    if (refresh === 'true' && user) {
      console.log('Refreshing subscription status after payment...');
      
      const fetchSubscriptionStatus = async () => {
        try {
          const url = `/api/subscription/status?t=${Date.now()}&force=true`;
          const response = await apiCall(url, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSubscriptionStatus(data);
          }
        } catch (error) {
          console.error('Error refreshing subscription status:', error);
        }
      };
      
      fetchSubscriptionStatus();
      // Remove the refresh parameter from URL
      router.replace('/subscription');
    }
  }, [searchParams, user?.id, router, apiCall, user]); // Include all dependencies

  // Remove all auto-refresh mechanisms - they're causing too many API calls
  // Users can manually refresh if needed



  const handlePlanClick = async (plan: string) => {
    // Prevent multiple clicks
    if (isProcessing) {
      console.log('Payment already in progress, ignoring click');
      return;
    }
    
    setIsProcessing(true);
    setProcessingPlan(plan);
    try {
      console.log(`Creating checkout session for plan: ${plan}`);
      const response = await apiCall('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Checkout session created, redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        const error = await response.json();
        console.error('Checkout session creation failed:', error);
        alert(error.message || (i18n.language === 'id' ? 'Gagal membuat sesi pembayaran' : 'Failed to create payment session'));
        setIsProcessing(false);
        setProcessingPlan(null);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(i18n.language === 'id' ? 'Terjadi kesalahan' : 'An error occurred');
      setIsProcessing(false);
      setProcessingPlan(null);
    } finally {
      // Don't reset isProcessing here as we're redirecting on success
      // setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="subscription" />
          </div>
        </div>
      </div>
    );
  }

  // Show payment processing loading card
  if (isProcessing) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="payment" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-12">

        {/* Current Status */}
        {subscriptionStatus && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-100 to-purple-200">
                    <Crown className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-purple-600">
                    {i18n.language === 'id' ? 'Status Langganan' : 'Subscription Status'}
                  </h2>
                </div>
                
                {/* Management Link - Show for all active subscriptions */}
                {subscriptionStatus.status === 'active' && (
                  <button
                    onClick={() => {
                      console.log('Kelola Langganan clicked, navigating to /subscription/manage');
                      router.push('/subscription/manage');
                    }}
                    className="text-slate-800 hover:text-slate-900 font-bold text-sm sm:text-sm transition-colors duration-200 cursor-pointer"
                  >
                    {i18n.language === 'id' ? 'Kelola' : 'Manage'}
                  </button>
                )}
              </div>
              
              
              {subscriptionStatus.status === 'active' && (
                <div className="space-y-4">
                  {/* Unified grid with all three cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Trial Status Card - Always show, but with different status based on current plan */}
                    {(() => {
                      const now = new Date();
                      const isCurrentlyTrial = subscriptionStatus.subscription?.plan === 'trial';
                      
                      // For trial users, check if still in trial period
                      // For paid users, trial has ended
                      let isStillInTrialPeriod = false;
                      let trialEndDate = null;
                      
                      if (isCurrentlyTrial) {
                        const subscriptionStart = new Date(subscriptionStatus.subscription?.currentPeriodStart || subscriptionStatus.subscription?.createdAt || new Date());
                        trialEndDate = new Date(subscriptionStart);
                        trialEndDate.setDate(trialEndDate.getDate() + 3); // Original 3-day trial period
                        isStillInTrialPeriod = now <= trialEndDate;
                      } else {
                        // For paid users, trial has ended
                        isStillInTrialPeriod = false;
                      }
                      
                      return (
                        <div className={`bg-gradient-to-r p-4 rounded-xl border-l-4 ${
                          isStillInTrialPeriod 
                            ? 'from-blue-50 to-indigo-50 border-blue-500' 
                            : 'from-gray-50 to-slate-50 border-gray-400'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              isStillInTrialPeriod ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Star className={`w-5 h-5 ${
                                isStillInTrialPeriod ? 'text-blue-600' : 'text-gray-500'
                              }`} />
                            </div>
                            <div>
                              <h3 className={`font-semibold ${
                                isStillInTrialPeriod ? 'text-blue-900' : 'text-gray-700'
                              }`}>
                                {i18n.language === 'id' 
                                  ? isStillInTrialPeriod 
                                    ? 'Uji Coba Gratis 3 Hari'
                                    : 'Uji Coba Gratis Berakhir'
                                  : isStillInTrialPeriod
                                    ? '3-Day Free Trial'
                                    : 'Free Trial Ended'
                                }
                              </h3>
                              <p className={`text-sm ${
                                isStillInTrialPeriod ? 'text-blue-700' : 'text-gray-600'
                              }`}>
                                {i18n.language === 'id' 
                                  ? isStillInTrialPeriod 
                                    ? 'Anda masih aktif'
                                    : 'Telah berakhir'
                                  : isStillInTrialPeriod
                                    ? 'Currently active'
                                    : 'Has ended'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Active Access Card */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-green-100">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-900">
                              {i18n.language === 'id' ? 'Akses Aktif' : 'Active Access'}
                            </h3>
                            <p className="text-sm text-green-700">
                              {subscriptionStatus?.subscription?.plan === 'lifetime' ? (
                                i18n.language === 'id' 
                                  ? 'Anda memiliki langganan seumur hidup'
                                  : 'You have a lifetime subscription'
                              ) : (
                                i18n.language === 'id' 
                                  ? `Hingga ${new Date(subscriptionStatus.currentPeriodEnd!).toLocaleDateString('id-ID', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}`
                                  : `Until ${new Date(subscriptionStatus.currentPeriodEnd!).toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}`
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    

                    {/* Renewal Status Card - Show for all active subscriptions */}
                    {subscriptionStatus.status === 'active' && subscriptionStatus.subscription && (
                      <div className={`bg-gradient-to-r p-4 rounded-xl border-l-4 ${
                        subscriptionStatus?.subscription?.plan === 'lifetime'
                          ? 'from-purple-50 to-violet-50 border-purple-500'
                          : subscriptionStatus.subscription?.cancelled 
                            ? 'from-red-50 to-rose-50 border-red-500'
                            : 'from-blue-50 to-indigo-50 border-blue-500'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            subscriptionStatus?.subscription?.plan === 'lifetime'
                              ? 'bg-purple-100'
                              : subscriptionStatus.subscription?.cancelled 
                                ? 'bg-red-100'
                                : 'bg-blue-100'
                          }`}>
                            {subscriptionStatus?.subscription?.plan === 'lifetime' ? (
                              <Check className="w-5 h-5 text-purple-600" />
                            ) : (
                              <RefreshCw className={`w-5 h-5 ${
                                subscriptionStatus.subscription?.cancelled 
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }`} />
                            )}
                          </div>
                          <div>
                            <h3 className={`font-semibold ${
                              subscriptionStatus?.subscription?.plan === 'lifetime'
                                ? 'text-purple-900'
                                : subscriptionStatus.subscription?.cancelled 
                                  ? 'text-red-900'
                                  : 'text-blue-900'
                            }`}>
                              {subscriptionStatus?.subscription?.plan === 'lifetime'
                                ? (i18n.language === 'id' ? 'Langganan Seumur Hidup' : 'Lifetime Subscription')
                                : subscriptionStatus.subscription?.cancelled 
                                  ? (i18n.language === 'id' ? 'Langganan Dibatalkan' : 'Subscription Cancelled')
                                  : (i18n.language === 'id' ? 'Pembaruan Otomatis' : 'Auto Renewal')
                              }
                            </h3>
                            <p className={`text-sm ${
                              subscriptionStatus?.subscription?.plan === 'lifetime'
                                ? 'text-purple-700'
                                : subscriptionStatus.subscription?.cancelled 
                                  ? 'text-red-700'
                                  : 'text-blue-700'
                            }`}>
                              {subscriptionStatus?.subscription?.plan === 'lifetime' ? (
                                i18n.language === 'id' 
                                  ? 'Langganan anda tidak akan diperpanjang otomatis'
                                  : 'Your subscription will not be automatically renewed'
                              ) : subscriptionStatus.subscription?.cancelled ? (
                                i18n.language === 'id' 
                                  ? `Langganan anda tidak akan diperpanjang setelah ${new Date(subscriptionStatus.currentPeriodEnd!).toLocaleDateString('id-ID', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}`
                                  : `Your subscription will not be renewed after ${new Date(subscriptionStatus.currentPeriodEnd!).toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}`
                              ) : (() => {
                                  const plan = subscriptionStatus.subscription?.plan;
                                  const renewalDate = new Date(subscriptionStatus.currentPeriodEnd!).toLocaleDateString(
                                    i18n.language === 'id' ? 'id-ID' : 'en-US', 
                                    { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    }
                                  );
                                  
                                  if (plan === '1day' || plan === '1week') {
                                    return i18n.language === 'id' 
                                      ? `Anda akan menerima email reminder untuk memperpanjang langganan sebelum masa aktif berakhir pada ${renewalDate}.`
                                      : `You will receive a reminder email to renew your subscription before it expires on ${renewalDate}.`;
                                  } else {
                                    return i18n.language === 'id' 
                                      ? `Langganan anda akan diperpanjang otomatis pada ${renewalDate}`
                                      : `Your subscription will be automatically renewed on ${renewalDate}`;
                                  }
                                })()
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>
              )}
              
              {subscriptionStatus.status === 'expired' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border-l-4 border-red-500">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-red-100">
                        <Zap className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-900">
                          {i18n.language === 'id' ? 'Langganan Berakhir' : 'Subscription Expired'}
                        </h3>
                        <p className="text-sm text-red-700">
                          {i18n.language === 'id' 
                            ? 'Pilih paket untuk melanjutkan akses'
                            : 'Choose a plan to continue access'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {i18n.language === 'id' ? 'Pilih Paket Langganan Anda' : 'Choose Your Subscription Plan'}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {i18n.language === 'id' 
              ? 'Akses penuh ke semua fitur tes berbicara dengan feedback AI yang canggih'
              : 'Get full access to all speaking test features with advanced AI feedback'
            }
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 max-w-7xl mx-auto">
          {/* 1 Day Plan */}
          <div 
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative flex flex-col h-full transition-all duration-200 group ${
              subscriptionStatus?.subscription?.plan === 'lifetime' 
                ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                : isProcessing 
                  ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                  : 'hover:border-gray-300 hover:shadow-md cursor-pointer'
            }`}
            onClick={() => {
              if (subscriptionStatus?.subscription?.plan === 'lifetime') {
                return; // Do nothing for lifetime users
              }
              if (!isProcessing) {
                handlePlanClick('1day');
              }
            }}
          >
            {/* Custom Tooltip for Lifetime Users */}
            {subscriptionStatus?.subscription?.plan === 'lifetime' && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-[9999] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {i18n.language === 'id' ? 'Anda memiliki langganan seumur hidup' : 'You have a lifetime subscription'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
            {processingPlan === '1day' ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingCard type="payment" />
              </div>
            ) : (
              <div className="text-center flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {i18n.language === 'id' ? '1 Hari' : '1 Day'}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-4">
                    7.99 €
                  </div>
                
                <ul className="space-y-1 mb-4 text-left text-xs">
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Tes berbicara tanpa batas' : 'Unlimited speaking tests'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Feedback AI' : 'AI feedback'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Semua bagian tes' : 'All test parts'}</span>
                  </li>
                </ul>
                </div>
                
                <div className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors mt-auto text-xs text-center ${
                  isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  {isProcessing ? (i18n.language === 'id' ? 'Memproses...' : 'Processing...') : (i18n.language === 'id' ? 'Pilih' : 'Choose')}
                </div>
              </div>
            )}
          </div>

          {/* 1 Week Plan */}
          <div 
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative flex flex-col h-full transition-all duration-200 group ${
              subscriptionStatus?.subscription?.plan === 'lifetime' 
                ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                : isProcessing 
                  ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                  : 'hover:border-gray-300 hover:shadow-md cursor-pointer'
            }`}
            onClick={() => {
              if (subscriptionStatus?.subscription?.plan === 'lifetime') {
                return; // Do nothing for lifetime users
              }
              if (!isProcessing) {
                handlePlanClick('1week');
              }
            }}
          >
            {/* Custom Tooltip for Lifetime Users */}
            {subscriptionStatus?.subscription?.plan === 'lifetime' && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-[9999] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {i18n.language === 'id' ? 'Anda memiliki langganan seumur hidup' : 'You have a lifetime subscription'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
            {processingPlan === '1week' ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingCard type="payment" />
              </div>
            ) : (
              <div className="text-center flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {i18n.language === 'id' ? '1 Minggu' : '1 Week'}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    2.14 €/{i18n.language === 'id' ? 'hari' : 'day'}
                  </div>
                  <div className="text-xs text-green-600 font-bold mb-4">
                    save 65%
                  </div>
                
                <ul className="space-y-1 mb-4 text-left text-xs">
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Tes berbicara tanpa batas' : 'Unlimited speaking tests'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Feedback AI' : 'AI feedback'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Semua bagian tes' : 'All test parts'}</span>
                  </li>
                </ul>
                </div>
                
                <div className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors mt-auto text-xs text-center ${
                  isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  {isProcessing ? (i18n.language === 'id' ? 'Memproses...' : 'Processing...') : (i18n.language === 'id' ? 'Pilih' : 'Choose')}
                </div>
              </div>
            )}
          </div>

          {/* 1 Month Plan - Most Popular */}
          <div 
            className={`bg-white rounded-lg shadow-sm border border-blue-500 p-4 relative flex flex-col h-full transition-all duration-200 group ${
              subscriptionStatus?.subscription?.plan === 'lifetime' 
                ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                : isProcessing 
                  ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                  : 'hover:border-blue-600 hover:shadow-md cursor-pointer'
            }`}
            onClick={() => {
              if (subscriptionStatus?.subscription?.plan === 'lifetime') {
                return; // Do nothing for lifetime users
              }
              if (!isProcessing) {
                handlePlanClick('1month');
              }
            }}
          >
            {/* Custom Tooltip for Lifetime Users */}
            {subscriptionStatus?.subscription?.plan === 'lifetime' && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-[9999] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {i18n.language === 'id' ? 'Anda memiliki langganan seumur hidup' : 'You have a lifetime subscription'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>{i18n.language === 'id' ? 'POPULER' : 'POPULAR'}</span>
              </div>
            </div>
            
            {processingPlan === '1month' ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingCard type="payment" />
              </div>
            ) : (
              <div className="text-center flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {i18n.language === 'id' ? '1 Bulan' : '1 Month'}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    0.99 €/{i18n.language === 'id' ? 'hari' : 'day'}
                  </div>
                  <div className="text-xs text-green-600 font-bold mb-4">
                    save 75%
                  </div>
                
                <ul className="space-y-1 mb-4 text-left text-xs">
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Tes berbicara tanpa batas' : 'Unlimited speaking tests'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Feedback AI' : 'AI feedback'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Pelacakan kemajuan' : 'Progress tracking'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Semua bagian tes' : 'All test parts'}</span>
                  </li>
                </ul>
                </div>
                
                <div className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors mt-auto text-xs text-center ${
                  isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  {isProcessing ? (i18n.language === 'id' ? 'Memproses...' : 'Processing...') : (i18n.language === 'id' ? 'Pilih' : 'Choose')}
                </div>
              </div>
            )}
          </div>

          {/* 3 Months Plan */}
          <div 
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative flex flex-col h-full transition-all duration-200 group ${
              subscriptionStatus?.subscription?.plan === 'lifetime' 
                ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                : isProcessing 
                  ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                  : 'hover:border-gray-300 hover:shadow-md cursor-pointer'
            }`}
            onClick={() => {
              if (subscriptionStatus?.subscription?.plan === 'lifetime') {
                return; // Do nothing for lifetime users
              }
              if (!isProcessing) {
                handlePlanClick('3months');
              }
            }}
          >
            {/* Custom Tooltip for Lifetime Users */}
            {subscriptionStatus?.subscription?.plan === 'lifetime' && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-[9999] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {i18n.language === 'id' ? 'Anda memiliki langganan seumur hidup' : 'You have a lifetime subscription'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
            {processingPlan === '3months' ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingCard type="payment" />
              </div>
            ) : (
              <div className="text-center flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {i18n.language === 'id' ? '3 Bulan' : '3 Months'}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    0.78 €/{i18n.language === 'id' ? 'hari' : 'day'}
                  </div>
                  <div className="text-xs text-green-600 font-bold mb-4">
                    save 80%
                  </div>
                
                <ul className="space-y-1 mb-4 text-left text-xs">
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Tes berbicara tanpa batas' : 'Unlimited speaking tests'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Feedback AI' : 'AI feedback'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Pelacakan kemajuan' : 'Progress tracking'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Semua bagian tes' : 'All test parts'}</span>
                  </li>
                </ul>
                </div>
                
                <div className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors mt-auto text-xs text-center ${
                  isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  {isProcessing ? (i18n.language === 'id' ? 'Memproses...' : 'Processing...') : (i18n.language === 'id' ? 'Pilih' : 'Choose')}
                </div>
              </div>
            )}
          </div>

          {/* 6 Months Plan */}
          <div 
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative flex flex-col h-full transition-all duration-200 group ${
              subscriptionStatus?.subscription?.plan === 'lifetime' 
                ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                : isProcessing 
                  ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                  : 'hover:border-gray-300 hover:shadow-md cursor-pointer'
            }`}
            onClick={() => {
              if (subscriptionStatus?.subscription?.plan === 'lifetime') {
                return; // Do nothing for lifetime users
              }
              if (!isProcessing) {
                handlePlanClick('6months');
              }
            }}
          >
            {/* Custom Tooltip for Lifetime Users */}
            {subscriptionStatus?.subscription?.plan === 'lifetime' && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-[9999] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {i18n.language === 'id' ? 'Anda memiliki langganan seumur hidup' : 'You have a lifetime subscription'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
            {processingPlan === '6months' ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingCard type="payment" />
              </div>
            ) : (
              <div className="text-center flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {i18n.language === 'id' ? '6 Bulan' : '6 Months'}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    0.67 €/{i18n.language === 'id' ? 'hari' : 'day'}
                  </div>
                  <div className="text-xs text-green-600 font-bold mb-4">
                    save 85%
                  </div>
                
                <ul className="space-y-1 mb-4 text-left text-xs">
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Tes berbicara tanpa batas' : 'Unlimited speaking tests'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Feedback AI' : 'AI feedback'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Pelacakan kemajuan' : 'Progress tracking'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Semua bagian tes' : 'All test parts'}</span>
                  </li>
                </ul>
                </div>
                
                <div className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors mt-auto text-xs text-center ${
                  isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  {isProcessing ? (i18n.language === 'id' ? 'Memproses...' : 'Processing...') : (i18n.language === 'id' ? 'Pilih' : 'Choose')}
                </div>
              </div>
            )}
          </div>

          {/* Lifetime Plan */}
          <div 
            className={`bg-white rounded-lg shadow-sm border border-purple-500 p-4 relative flex flex-col h-full transition-all duration-200 group ${
              subscriptionStatus?.subscription?.plan === 'lifetime' 
                ? 'opacity-75 cursor-not-allowed bg-purple-50' 
                : isProcessing 
                  ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                  : 'hover:border-purple-600 hover:shadow-md cursor-pointer'
            }`}
            onClick={() => {
              if (subscriptionStatus?.subscription?.plan === 'lifetime') {
                return; // Do nothing for lifetime users
              }
              if (!isProcessing) {
                handlePlanClick('lifetime');
              }
            }}
          >
            {/* Custom Tooltip for Lifetime Users */}
            {subscriptionStatus?.subscription?.plan === 'lifetime' && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-[9999] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {i18n.language === 'id' ? 'Anda memiliki langganan seumur hidup' : 'You have a lifetime subscription'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                <Crown className="w-3 h-3" />
                <span>{i18n.language === 'id' ? 'SEUMUR HIDUP' : 'LIFETIME'}</span>
              </div>
            </div>
            
            {processingPlan === 'lifetime' ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingCard type="payment" />
              </div>
            ) : (
              <div className="text-center flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {i18n.language === 'id' ? 'Seumur Hidup' : 'Lifetime'}
                  </h3>
                  <div className="text-2xl font-bold text-purple-600 mb-4">
                    199.99 €
                  </div>
                
                <ul className="space-y-1 mb-4 text-left text-xs">
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Tes berbicara tanpa batas' : 'Unlimited speaking tests'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Feedback AI' : 'AI feedback'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Pelacakan kemajuan' : 'Progress tracking'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Semua bagian tes' : 'All test parts'}</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-700 font-medium">{i18n.language === 'id' ? 'Akses selamanya' : 'Access forever'}</span>
                  </li>
                </ul>
                </div>
                
                <div className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors mt-auto text-xs text-center ${
                  isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}>
                  {isProcessing ? (i18n.language === 'id' ? 'Memproses...' : 'Processing...') : (i18n.language === 'id' ? 'Pilih' : 'Choose')}
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {i18n.language === 'id' ? 'Semua Paket Termasuk' : 'All Plans Include'}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {i18n.language === 'id' ? 'Tes Tanpa Batas' : 'Unlimited Tests'}
              </h3>
              <p className="text-xs sm:text-base text-gray-600">
                {i18n.language === 'id' 
                  ? 'Lakukan tes sebanyak yang Anda inginkan untuk meningkatkan kemampuan berbicara Anda.'
                  : 'Take as many tests as you want to improve your speaking skills.'
                }
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-100" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {i18n.language === 'id' ? 'Feedback AI' : 'AI Feedback'}
              </h3>
              <p className="text-xs sm:text-base text-gray-600">
                {i18n.language === 'id' 
                  ? 'Dapatkan feedback mendetail tentang pengucapan, tata bahasa, dan kelancaran.'
                  : 'Get detailed feedback on pronunciation, grammar, and fluency.'
                }
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {i18n.language === 'id' ? 'Semua Bagian Tes' : 'All Test Parts'}
              </h3>
              <p className="text-xs sm:text-base text-gray-600">
                {i18n.language === 'id' 
                  ? 'Akses ke Teil 1, 2, dan 3 dari Goethe Zertifikat B1 - Sprechen.'
                  : 'Access to Teil 1, 2, and 3 of Goethe Zertifikat B1 - Sprechen.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
