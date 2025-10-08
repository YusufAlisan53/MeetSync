import { useState, useEffect, useCallback } from 'react';
import { authApiService } from '../services/authApiService';
import type { User, LoginCredentials, RegisterCredentials } from '../types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Authentication hook
 */
export function useAuth() {
  // İlk yükleme sırasında localStorage'dan hemen veri al
  const initialUser = authApiService.getCurrentUserFromStorage();
  const initialAuth = authApiService.isAuthenticated();
  
  const [state, setState] = useState<AuthState>({
    user: initialUser,
    isAuthenticated: initialAuth,
    loading: false, // localStorage'dan veri aldığımız için loading false
    error: null,
  });

  // Kullanıcı bilgilerini localStorage'dan yükle
  const loadUserFromStorage = useCallback(() => {
    const user = authApiService.getCurrentUserFromStorage();
    const isAuthenticated = authApiService.isAuthenticated();
    
    setState(prev => {
      // Eğer aynı user ve auth durumu ise state güncellemesini atla
      if (prev.user?.id === user?.id && prev.isAuthenticated === isAuthenticated) {
        return prev;
      }
      
      return {
        user,
        isAuthenticated,
        loading: false,
        error: null,
      };
    });
  }, []);

  // Uygulama başladığında kullanıcı bilgilerini yükle
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Login
  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const authResponse = await authApiService.login(credentials);
      
      // Login sonrası kullanıcı bilgilerini localStorage'dan al (artık login'de set ediliyor)
      const user = authApiService.getCurrentUserFromStorage();
      setState({
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      
      return authResponse;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Giriş başarısız';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Admin tarafından kullanıcı oluşturma
  const createUser = async (credentials: RegisterCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await authApiService.createUser(credentials);
      setState(prev => ({ ...prev, loading: false, error: null }));
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Kullanıcı oluşturma başarısız';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    console.log('useAuth: logout started');
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await authApiService.logout();
      console.log('useAuth: logout successful, updating state');
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      // Logout hatası olsa bile local state'i temizle
      console.log('useAuth: logout error, clearing state anyway', error);
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  };


  // Mevcut kullanıcı bilgilerini API'den yenile
  const refreshUser = async () => {
    if (!state.isAuthenticated) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const user = await authApiService.getCurrentUser();
      setState(prev => ({
        ...prev,
        user,
        loading: false,
      }));
      return user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Kullanıcı bilgileri alınamadı';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Şifre değiştir
  const changePassword = async (oldPassword: string, newPassword: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await authApiService.changePassword(oldPassword, newPassword);
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Şifre değiştirilemedi';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Hata temizle
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    login,
    createUser,
    logout,
    refreshUser,
    changePassword,
    clearError,
  };
}
