import { BaseApiService } from './BaseApiService';
import apiClient from '../utils/axios';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
  ApiResponse
} from '../types/api';
import axios, { AxiosResponse } from 'axios';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5278/api';

/**
 * Authentication API Service
 */
class AuthApiService extends BaseApiService {
  private periodicTaskInterval: NodeJS.Timeout | null = null;
  private static instance: AuthApiService | null = null;

  constructor() {
    super('/auth');
    
    // Singleton pattern - sadece bir kez periyodik görev başlat
    if (!AuthApiService.instance) {
      this.startPeriodicTask();
      AuthApiService.instance = this;
    }
    return AuthApiService.instance;
  }

  /**
   * Kullanıcı girişi
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await apiClient.post(
      '/Auth/Login',
      credentials // Backend direkt email ve password bekliyor
    );
    
    // Login response'u zaten doğru format'ta geliyor
    const authData = response.data as AuthResponse;
    
    // Token'ı localStorage'a kaydet
    localStorage.setItem('access_token', authData.accessToken.token);
    localStorage.setItem('token_expiration', authData.accessToken.expirationDate);
    
    // JWT token'ı decode ederek temel kullanıcı bilgilerini çıkar
    const basicUserInfo = this.decodeTokenAndExtractUserInfo(authData.accessToken.token);
    
    // API'den tam kullanıcı bilgilerini çekmeyi dene (tek seferlik)
    try {
      // Önce tüm kullanıcıları çekip filtreleme yap
      const response: AxiosResponse<any> = await apiClient.get('/Users?PageIndex=0&PageSize=1000');
      const usersData = response.data;
      
      // Kullanıcıyı ID'ye göre bul
      const apiUser = usersData.items?.find((user: any) => user.id === basicUserInfo.id);
      
      if (apiUser) {
        // API'den gelen verilerle kullanıcı bilgilerini güncelle
        const completeUser: User = {
          ...basicUserInfo,
          nameSurname: apiUser.nameSurname || basicUserInfo.nameSurname,
          userName: apiUser.userName || basicUserInfo.userName,
          phone: apiUser.phone,
        };
        
        localStorage.setItem('user', JSON.stringify(completeUser));
      } else {
        localStorage.setItem('user', JSON.stringify(basicUserInfo));
      }
    } catch (apiError) {
      // Hata durumunda token bilgilerini kullan
      localStorage.setItem('user', JSON.stringify(basicUserInfo));
    }
    
    return authData;
  }

  /**
   * JWT token'ı decode ederek kullanıcı bilgilerini çıkarır
   */
  private decodeTokenAndExtractUserInfo(token: string): User {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Token is undefined or not a string');
      }
      
      // JWT payload'ını decode et
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const base64Url = tokenParts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const claims = JSON.parse(jsonPayload);
      
      // Claims'den kullanıcı bilgilerini çıkar
      const userId = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      const email = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
      const nameSurname = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || email.split('@')[0];
      const userName = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/given_name"] || claims["userName"] || email.split('@')[0];
      const roles = claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || [];
      const isAdmin = roles.includes('Admin') || roles.includes('Users.Admin');
      
      // User objesini oluştur
      const userObj = {
        id: userId,
        nameSurname: nameSurname,
        userName: userName,
        email: email,
        phone: undefined,
        role: (isAdmin ? 'admin' : (roles.includes('Users.Admin') ? 'moderator' : 'user')) as 'admin' | 'moderator' | 'user',
        roles: Array.isArray(roles) ? roles : [roles], // Tüm rolleri sakla
        isAdmin: isAdmin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return userObj;
    } catch (error) {
      console.error('Token decode error:', error);
      throw new Error('Invalid token format');
    }
  }

  /**
   * Admin tarafından yeni kullanıcı oluşturma
   */
  async createUser(credentials: RegisterCredentials): Promise<{ id: string; message: string }> {
    try {
      // Kullanıcıyı oluştur
      const userResponse: AxiosResponse<any> = await apiClient.post(
        '/Users',
        {
          nameSurname: credentials.nameSurname,
          userName: credentials.userName,
          email: credentials.email,
          password: credentials.password,
          isAdmin: credentials.isAdmin || false
        }
      );
      
      console.log('User creation response:', userResponse.data);
      
      const createdUserId = userResponse.data.id;
      
      //claim kısmı
      if (credentials.operationClaims && credentials.operationClaims.length > 0) {
        console.log('Adding claims to user:', createdUserId, credentials.operationClaims);
        
        const failedClaims: number[] = [];
        
        for (const operationClaimId of credentials.operationClaims) {
          try {
            await apiClient.post('/UserOperationClaims', {
              userId: createdUserId,
              operationClaimId: operationClaimId
            });
            console.log(`Claim ${operationClaimId} added to user ${createdUserId}`);
          } catch (claimError) {
            console.error(`Failed to add claim ${operationClaimId}:`, claimError);
            failedClaims.push(operationClaimId);
          }
        }
       if (failedClaims.length > 0) {
          throw new Error(`Kullanıcı oluşturuldu ancak bazı yetkiler atanamadı. Başarısız yetkiler: ${failedClaims.join(', ')}`);
          //hata mesajı
        }
      }
      
      return {
        id: createdUserId,
        message: 'Kullanıcı başarıyla oluşturuldu'
      };
      
    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    console.log('authApiService: logout started');
    console.log('authApiService: redirecting to signin');
    this.clearTokens();
    window.location.href = '/signin';
  }

  async refreshToken(): Promise<string> {
    try {
      // Cookie'leri gönderecek şekilde axios yapılandırması
      const response: AxiosResponse<any> = await axios.get(`${BASE_URL}/Auth/RefreshToken`, {
        withCredentials: true // Cookie'leri gönder
      });

      const newToken = response.data.token;
      const newExpiration = response.data.expirationDate;
      
      localStorage.setItem('access_token', newToken);
      localStorage.setItem('token_expiration', newExpiration);
      
      return newToken;
    } catch (error) {
      // Refresh başarısız, kullanıcıyı logout et
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Mevcut kullanıcı bilgilerini getir
   */
  async getCurrentUser(): Promise<User> {
    // Önce localStorage'dan kontrol et
    const cachedUser = this.getCurrentUserFromStorage();
    if (cachedUser) {
      return cachedUser; // Cache'den döndür, yeniden API çağrısı yapma
    }

    // Cache yoksa token'dan kullanıcı bilgilerini çıkarmayı dene
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userInfo = this.decodeTokenAndExtractUserInfo(token);
        
        // API'den tam kullanıcı bilgilerini çek (sadece cache yoksa)
        try {
          const response: AxiosResponse<any> = await apiClient.get('/Users?PageIndex=0&PageSize=1000');
          const usersData = response.data;
          
          // Kullanıcıyı ID'ye göre bul
          const apiUser = usersData.items?.find((user: any) => user.id === userInfo.id);
          
          if (apiUser) {
            // API'den gelen verilerle kullanıcı bilgilerini güncelle
            const completeUser: User = {
              ...userInfo,
              nameSurname: apiUser.nameSurname || userInfo.nameSurname,
              userName: apiUser.userName || userInfo.userName,
              phone: apiUser.phone,
            };
            
            localStorage.setItem('user', JSON.stringify(completeUser));
            return completeUser;
          } else {
            localStorage.setItem('user', JSON.stringify(userInfo));
            return userInfo;
          }
        } catch (apiError) {
          localStorage.setItem('user', JSON.stringify(userInfo));
          return userInfo;
        }
      } catch (error) {
        console.error('Token decode error:', error);
      }
    }
    
    // Son çare: API'den direkt çekmeyi dene
    try {
      const response: AxiosResponse<ApiResponse<User>> = await apiClient.get('/auth/me');
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Şifre değiştirme
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const response: AxiosResponse<ApiResponse<{ message: string }>> = await apiClient.post(
      '/auth/change-password',
      { old_password: oldPassword, new_password: newPassword }
    );
    return response.data.data;
  }

  /**
   * Token geçerliliğini kontrol et
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const expiration = localStorage.getItem('token_expiration');
    
    if (!token || !expiration) {
      return false;
    }
    
    return true;
  }

  /**
   * Token'ları temizle
   */
  private clearTokens(): void {
    console.log('authApiService: clearTokens called');
    localStorage.removeItem('access_token');
    //TODO: Refresh token cookie'den silinecek
    //localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiration');
    localStorage.removeItem('user');
    console.log('authApiService: tokens cleared');
  }

  /**
   * Mevcut kullanıcıyı localStorage'dan getir
   */
  getCurrentUserFromStorage(): User | null {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  /**
   * Kullanıcının belirli bir rolü var mı kontrol et
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUserFromStorage();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Kullanıcının admin yetkisi var mı kontrol et
   */
  isAdmin(): boolean {
    return this.hasRole('Admin') || this.hasRole('Users.Admin');
  }

  /**
   * Kullanıcının belirli bir yetkisi var mı kontrol et
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUserFromStorage();
    return user?.roles?.some(role => role.includes(permission)) || false;
  }

  /**
   * 5 dakikada bir çalışan periyodik görev başlatır
   */
  private startPeriodicTask(): void {
    // Development ortamında loglama
    if (import.meta.env.DEV) {
      console.log('AuthApiService: Periyodik görev başlatılıyor (2 dakikada bir)');
    }
    
    // Mevcut interval varsa temizle
    if (this.periodicTaskInterval) {
      clearInterval(this.periodicTaskInterval);
    }

    // 2 dakikada bir çalışacak fonksiyonu başlat (2 * 60 * 1000 = 120000 ms)
    this.periodicTaskInterval = setInterval(() => {
      this.executePeriodicTask();
    }, 2 * 60 * 1000);

    if (import.meta.env.DEV) {
      console.log('AuthApiService: Periyodik görev başlatıldı');
    }
  }

  /**
   * 2 dakikada bir çalışan görev fonksiyonu
   */
  private executePeriodicTask(): void {
    try {
      // Token kontrolü yap
      const isAuth = this.isAuthenticated();
      
      // Eğer kullanıcı giriş yapmışsa token yenilemeyi dene
      if (isAuth) {
        const token = localStorage.getItem('access_token');
        const expiration = localStorage.getItem('token_expiration');
        
        if (token && expiration) {
          const expirationDate = new Date(expiration);
          const now = new Date();
          const timeUntilExpiry = expirationDate.getTime() - now.getTime();

          // Token 2 dakika içinde sona erecekse yenilemeyi dene
          if (timeUntilExpiry < 2 * 60 * 1000) {
            if (import.meta.env.DEV) {
              console.log('AuthApiService: Token yakında sona erecek, yenileme deneniyor...');
            }
            this.refreshToken().catch((error) => {
              console.error('AuthApiService: Token yenileme başarısız:', error);
            });
          }
        }
      }
      
    } catch (error) {
      console.error('AuthApiService: Periyodik görev hatası:', error);
    }
  }

  /**
   * Periyodik görevi durdurur
   */
  stopPeriodicTask(): void {
    console.log('AuthApiService: Periyodik görev durduruluyor');
    
    if (this.periodicTaskInterval) {
      clearInterval(this.periodicTaskInterval);
      this.periodicTaskInterval = null;
      console.log('AuthApiService: Periyodik görev durduruldu');
    }
  }

  /**
   * Service temizleme - component unmount edildiğinde çağrılabilir
   */
  cleanup(): void {
    this.stopPeriodicTask();
  }
}

// Singleton instance
export const authApiService = new AuthApiService();
export default authApiService;
