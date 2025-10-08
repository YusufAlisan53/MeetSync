# Axios API Entegrasyonu

Bu proje için eklenen Axios API yapısı ve kullanım kılavuzu.

## 📁 Yapı

```
src/
├── services/           # API servisleri
│   ├── BaseApiService.ts     # Temel API service sınıfı
│   ├── authApiService.ts     # Authentication servisleri
│   ├── userApiService.ts     # Kullanıcı servisleri
│   ├── dashboardApiService.ts # Dashboard servisleri
│   └── index.ts             # Servis export'ları
├── hooks/              # React hook'lar
│   ├── useApi.ts            # Genel API hook'u
│   ├── useAuth.ts           # Authentication hook'u
│   └── index.ts             # Hook export'ları
├── types/              # TypeScript type'lar
│   └── api.ts               # API type tanımları
├── utils/              # Yardımcı fonksiyonlar
│   ├── axios.ts             # Axios konfigürasyonu
│   └── helpers.ts           # Genel yardımcı fonksiyonlar
└── components/
    └── examples/
        └── ApiExamples.tsx   # Kullanım örnekleri
```

## 🚀 Kurulum

1. **Environment Variables**: `.env.example` dosyasını `.env` olarak kopyalayın ve API URL'nizi ayarlayın:
```bash
cp .env.example .env
```

2. **API Base URL**: `.env` dosyasında API base URL'nizi ayarlayın:
```
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## 📖 Kullanım

### 1. Authentication

```tsx
import { useAuth } from '../hooks';

const LoginComponent = () => {
  const { login, logout, user, isAuthenticated, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' });
      console.log('Giriş başarılı!');
    } catch (error) {
      console.error('Giriş hatası:', error);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Hoş geldiniz, {user?.name}!</p>
          <button onClick={logout}>Çıkış Yap</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Giriş Yap</button>
      )}
    </div>
  );
};
```

### 2. API Çağrıları

#### Otomatik Yükleme:
```tsx
import { useApi } from '../hooks';
import { dashboardApiService } from '../services';

const Dashboard = () => {
  const { data, loading, error } = useApi(() => dashboardApiService.getStats());

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Toplam Kullanıcı: {data?.totalUsers}</p>
    </div>
  );
};
```

#### Manuel Yükleme:
```tsx
import { useApi } from '../hooks';
import { userApiService } from '../services';

const UserList = () => {
  const { data: users, loading, execute: loadUsers } = useApi(
    () => userApiService.getUsers({ page: 1, limit: 10 }),
    { immediate: false } // Otomatik yükleme kapalı
  );

  return (
    <div>
      <button onClick={loadUsers} disabled={loading}>
        {loading ? 'Yükleniyor...' : 'Kullanıcıları Yükle'}
      </button>
      {users && users.data.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
};
```

### 3. Mutation (POST, PUT, DELETE)

```tsx
import { useMutation } from '../hooks';
import { userApiService } from '../services';

const CreateUser = () => {
  const { mutate: createUser, loading, error } = useMutation(
    (userData) => userApiService.createUser(userData),
    {
      onSuccess: (newUser) => {
        console.log('Kullanıcı oluşturuldu:', newUser);
      },
      onError: (error) => {
        console.error('Hata:', error);
      }
    }
  );

  const handleSubmit = () => {
    createUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
  };

  return (
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
    </button>
  );
};
```

### 4. Doğrudan API Servisi Kullanımı

```tsx
import { userApiService, authApiService } from '../services';

// Async/await ile
const loadUserData = async () => {
  try {
    const users = await userApiService.getUsers({ page: 1, limit: 10 });
    console.log('Kullanıcılar:', users);
  } catch (error) {
    console.error('Hata:', error);
  }
};

// Authentication
const loginUser = async () => {
  try {
    const authResponse = await authApiService.login({
      email: 'user@example.com',
      password: 'password'
    });
    console.log('Giriş başarılı:', authResponse);
  } catch (error) {
    console.error('Giriş hatası:', error);
  }
};
```

## 🔧 API Servisleri

### AuthApiService
- `login(credentials)` - Kullanıcı girişi
- `register(credentials)` - Kullanıcı kaydı
- `logout()` - Kullanıcı çıkışı
- `getCurrentUser()` - Mevcut kullanıcı bilgileri
- `updateProfile(data)` - Profil güncelleme
- `changePassword(oldPassword, newPassword)` - Şifre değiştirme

### UserApiService
- `getUsers(params)` - Kullanıcı listesi
- `getUser(id)` - Tek kullanıcı
- `createUser(userData)` - Kullanıcı oluştur
- `updateUser(id, userData)` - Kullanıcı güncelle
- `deleteUser(id)` - Kullanıcı sil

### DashboardApiService
- `getStats()` - Dashboard istatistikleri
- `getRevenueChart(period)` - Gelir grafiği
- `getUserGrowthChart(period)` - Kullanıcı büyüme grafiği
- `getTopProducts(limit)` - En çok satan ürünler

## 🛡️ Error Handling

API hataları otomatik olarak işlenir:

- **401 Unauthorized**: Otomatik logout ve login sayfasına yönlendirme
- **403 Forbidden**: Erişim yasağı bildirimi
- **404 Not Found**: Kaynak bulunamadı
- **500 Internal Server Error**: Sunucu hatası

## 🔍 Interceptors

### Request Interceptor
- Her request'e otomatik token ekleme
- Development ortamında request loglama

### Response Interceptor
- Response loglama
- Otomatik error handling
- Token yenileme (gerekirse)



## 📝 Type Safety

Tüm API çağrıları TypeScript ile type-safe:

```tsx
import type { User, CreateUserDto, PaginatedResponse } from '../types/api';

// Type-safe API çağrıları
const users: PaginatedResponse<User> = await userApiService.getUsers();
const newUser: User = await userApiService.createUser(userData);
```

## 🎯 Best Practices

1. **Hook'ları Kullanın**: Direkt API çağrıları yerine hook'ları tercih edin
2. **Error Handling**: Her zaman error durumlarını handle edin
3. **Loading States**: Kullanıcıya loading durumunu gösterin
4. **Type Safety**: TypeScript type'larını kullanın
5. **Environment Variables**: API URL'leri environment variable'larda saklayın

## 🔄 Token Yenileme

Token'lar otomatik olarak yenilenir ve kullanıcı deneyimini bozmaz. Detaylı bilgi için [TOKEN_MANAGEMENT.md](./TOKEN_MANAGEMENT.md) dosyasına bakın.

Manual token yenileme örneği:

```tsx
import { authApiService } from '../services';

const refreshToken = async () => {
  try {
    const newToken = await authApiService.refreshToken();
    console.log('Token yenilendi:', newToken);
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    // Kullanıcıyı login sayfasına yönlendir
  }
};
```

## 📚 Örnek Kullanım

Tam kullanım örneği için `src/components/examples/ApiExamples.tsx` dosyasına bakın.

---

Bu yapı ile API çağrılarınızı düzenli, type-safe ve maintainable bir şekilde yönetebilirsiniz! 🚀
