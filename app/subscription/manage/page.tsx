"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import LoadingCard from "@/components/shared/LoadingCard";

interface SubscriptionDetails {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export default function ManageSubscriptionPage() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const { apiCall } = useApi();
  const router = useRouter();
  
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSubscriptionDetails = useCallback(async () => {
    try {
      const response = await apiCall('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          setSubscription({
            id: data.subscription.id,
            plan: data.subscription.plan,
            status: data.subscription.status,
            currentPeriodStart: new Date(data.subscription.currentPeriodStart),
            currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
            cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd || false,
            stripeSubscriptionId: data.subscription.stripeSubscriptionId,
            stripeCustomerId: data.subscription.stripeCustomerId,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    if (user) {
      fetchSubscriptionDetails();
    }
  }, [user?.id, fetchSubscriptionDetails, user]); // Include all dependencies

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) {
      setMessage({
        type: 'error',
        text: i18n.language === 'id' 
          ? 'Tidak dapat membatalkan langganan: ID langganan tidak ditemukan'
          : 'Cannot cancel subscription: Subscription ID not found'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiCall('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId
        }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: i18n.language === 'id' 
            ? 'Langganan berhasil dibatalkan. Anda akan tetap memiliki akses hingga akhir periode berlangganan.'
            : 'Subscription successfully cancelled. You will retain access until the end of your subscription period.'
        });
        // Refresh subscription details
        await fetchSubscriptionDetails();
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.message || (i18n.language === 'id' 
            ? 'Gagal membatalkan langganan'
            : 'Failed to cancel subscription')
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setMessage({
        type: 'error',
        text: i18n.language === 'id' 
          ? 'Terjadi kesalahan saat membatalkan langganan'
          : 'An error occurred while cancelling subscription'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) {
      setMessage({
        type: 'error',
        text: i18n.language === 'id' 
          ? 'Tidak dapat mengaktifkan kembali langganan: ID langganan tidak ditemukan'
          : 'Cannot reactivate subscription: Subscription ID not found'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiCall('/api/subscription/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId
        }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: i18n.language === 'id' 
            ? 'Langganan berhasil diaktifkan kembali'
            : 'Subscription successfully reactivated'
        });
        // Refresh subscription details
        await fetchSubscriptionDetails();
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.message || (i18n.language === 'id' 
            ? 'Gagal mengaktifkan kembali langganan'
            : 'Failed to reactivate subscription')
        });
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setMessage({
        type: 'error',
        text: i18n.language === 'id' 
          ? 'Terjadi kesalahan saat mengaktifkan kembali langganan'
          : 'An error occurred while reactivating subscription'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanName = (plan: string) => {
    const planNames = {
      '1day': i18n.language === 'id' ? '1 Hari' : '1 Day',
      '1week': i18n.language === 'id' ? '1 Minggu' : '1 Week',
      '1month': i18n.language === 'id' ? '1 Bulan' : '1 Month',
      '3months': i18n.language === 'id' ? '3 Bulan' : '3 Months',
      '6months': i18n.language === 'id' ? '6 Bulan' : '6 Months',
      'lifetime': i18n.language === 'id' ? 'Seumur Hidup' : 'Lifetime',
      'trial': i18n.language === 'id' ? 'Uji Coba Gratis' : 'Free Trial'
    };
    return planNames[plan as keyof typeof planNames] || plan;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'canceled':
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'canceled':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'past_due':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
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

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {i18n.language === 'id' ? 'Tidak Ada Langganan' : 'No Subscription Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {i18n.language === 'id' 
              ? 'Anda tidak memiliki langganan aktif. Silakan pilih paket langganan untuk melanjutkan.'
              : 'You do not have an active subscription. Please choose a subscription plan to continue.'
            }
          </p>
          <button
            onClick={() => router.push('/subscription')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {i18n.language === 'id' ? 'Pilih Paket Langganan' : 'Choose Subscription Plan'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{i18n.language === 'id' ? 'Kembali' : 'Back'}</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {i18n.language === 'id' ? 'Kelola Langganan' : 'Manage Subscription'}
          </h1>
          <p className="text-gray-600 mt-2">
            {i18n.language === 'id' 
              ? 'Kelola pengaturan langganan dan pembayaran Anda'
              : 'Manage your subscription and payment settings'
            }
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {i18n.language === 'id' ? 'Detail Langganan' : 'Subscription Details'}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {i18n.language === 'id' ? 'Paket' : 'Plan'}
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {getPlanName(subscription.plan)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {i18n.language === 'id' ? 'Status' : 'Status'}
                </label>
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                  {getStatusIcon(subscription.status)}
                  <span className="capitalize">{subscription.status}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {i18n.language === 'id' ? 'Periode Saat Ini' : 'Current Period'}
                </label>
                <p className="text-gray-900">
                  {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
                </p>
              </div>
              
              {subscription.cancelAtPeriodEnd && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {i18n.language === 'id' ? 'Akan Berakhir' : 'Will End'}
                  </label>
                  <p className="text-red-600 font-medium">
                    {subscription.currentPeriodEnd.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {i18n.language === 'id' ? 'Aksi Langganan' : 'Subscription Actions'}
          </h2>
          
          <div className="space-y-4">
            {subscription.cancelAtPeriodEnd ? (
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800">
                        {i18n.language === 'id' ? 'Langganan Dibatalkan' : 'Subscription Cancelled'}
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        {i18n.language === 'id' 
                          ? 'Langganan Anda akan berakhir pada tanggal yang ditunjukkan di atas. Anda dapat mengaktifkan kembali langganan kapan saja.'
                          : 'Your subscription will end on the date shown above. You can reactivate your subscription at any time.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleReactivateSubscription}
                  disabled={isProcessing}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing 
                    ? (i18n.language === 'id' ? 'Memproses...' : 'Processing...')
                    : (i18n.language === 'id' ? 'Aktifkan Kembali Langganan' : 'Reactivate Subscription')
                  }
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-800">
                        {i18n.language === 'id' ? 'Langganan Aktif' : 'Active Subscription'}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {i18n.language === 'id' 
                          ? 'Langganan Anda aktif dan akan diperbarui otomatis. Anda dapat membatalkan kapan saja.'
                          : 'Your subscription is active and will renew automatically. You can cancel at any time.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing 
                    ? (i18n.language === 'id' ? 'Memproses...' : 'Processing...')
                    : (i18n.language === 'id' ? 'Batalkan Langganan' : 'Cancel Subscription')
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
