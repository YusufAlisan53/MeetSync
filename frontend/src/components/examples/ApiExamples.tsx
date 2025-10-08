import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useMutation } from '../../hooks/useApi';
import { userApiService, dashboardApiService } from '../../services';
import type { User, CreateUserDto } from '../../types/api';

/**
 * Axios API kullanım örnekleri
 */
const ApiExamples: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Dashboard stats'ı otomatik yükle
  const {
    data: dashboardStats,
    loading: statsLoading,
    error: statsError,
  } = useApi(() => dashboardApiService.getStats(), {
    immediate: isAuthenticated, // Sadece giriş yapılmışsa yükle
  });

  // Kullanıcıları manuel yükle
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
    execute: loadUsers,
  } = useApi(() => userApiService.getUsers({ page: 1, limit: 10 }), {
    immediate: false, // Manuel yükleme
  });

  // Kullanıcı oluşturma mutation'ı
  const {
    loading: creatingUser,
    error: createUserError,
    mutate: createUser,
  } = useMutation((userData: CreateUserDto) => userApiService.createUser(userData), {
    onSuccess: (newUser) => {
      console.log('Yeni kullanıcı oluşturuldu:', newUser);
      loadUsers(); // Kullanıcı listesini yenile
    },
    onError: (error) => {
      console.error('Kullanıcı oluşturma hatası:', error);
    },
  });

  // Login fonksiyonu
  const handleLogin = async () => {
    try {
      await login({ email, password });
      console.log('Giriş başarılı!');
    } catch (error) {
      console.error('Giriş hatası:', error);
    }
  };

  // Yeni kullanıcı oluştur
  const handleCreateUser = () => {
    createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Axios API Kullanım Örnekleri</h1>

      {/* Authentication Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Authentication</h2>
        
        {isAuthenticated ? (
          <div>
            <p className="mb-2">Hoş geldiniz, {user?.name}!</p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Çıkış Yap
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Giriş Yap
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Stats Section */}
      {isAuthenticated && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Dashboard İstatistikleri</h2>
          
          {statsLoading && <p>Yükleniyor...</p>}
          {statsError && <p className="text-red-500">Hata: {statsError}</p>}
          {dashboardStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
                <p className="text-xl font-bold">{dashboardStats.totalUsers}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Toplam Gelir</p>
                <p className="text-xl font-bold">${dashboardStats.totalRevenue}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Toplam Sipariş</p>
                <p className="text-xl font-bold">{dashboardStats.totalOrders}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Dönüşüm Oranı</p>
                <p className="text-xl font-bold">{dashboardStats.conversionRate}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Section */}
      {isAuthenticated && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Kullanıcılar</h2>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={loadUsers}
              disabled={usersLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {usersLoading ? 'Yükleniyor...' : 'Kullanıcıları Yükle'}
            </button>
            
            <button
              onClick={handleCreateUser}
              disabled={creatingUser}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {creatingUser ? 'Oluşturuluyor...' : 'Yeni Kullanıcı Oluştur'}
            </button>
          </div>

          {usersError && <p className="text-red-500 mb-2">Hata: {usersError}</p>}
          {createUserError && <p className="text-red-500 mb-2">Oluşturma Hatası: {createUserError}</p>}
          
          {users && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Toplam {('meta' in users) ? users.meta.total : 0} kullanıcı
              </p>
              <div className="grid gap-2">
                {(('data' in users) ? users.data : users as User[]).map((user: User) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* API Usage Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">API Kullanım Bilgileri</h2>
        <div className="text-sm space-y-2">
          <p><strong>Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'https://jsonplaceholder.typicode.com'}</p>
          <p><strong>Authentication:</strong> Bearer Token (localStorage'da saklanır)</p>
          <p><strong>Timeout:</strong> 10 saniye</p>
          <p><strong>Error Handling:</strong> Otomatik interceptor ile yönetilir</p>
        </div>
      </div>
    </div>
  );
};

export default ApiExamples;
