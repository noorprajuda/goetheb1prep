import { useAuth } from '@/contexts/AuthContext';

export function useApi() {
  const { user } = useAuth();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    // Don't set Content-Type for FormData - let the browser set it automatically
    const isFormData = options.body instanceof FormData;
    
    const headers = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(user && { 'x-user-id': user.id }),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return { apiCall };
}
