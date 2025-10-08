import React from 'react';
import { authApiService } from '../../services';

/**
 * Basit API test komponenti
 */
const SimpleApiTest: React.FC = () => {
  const testBasicApi = async () => {
    try {
      console.log('🔍 Test API çağrısı başlıyor...');
      
      // JSONPlaceholder API test (default endpoint)
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      
      console.log('✅ Test başarılı:', data);
      alert('API test başarılı! Console\'u kontrol edin.');
    } catch (error) {
      console.error('❌ Test hatası:', error);
      alert('API test başarısız! Console\'u kontrol edin.');
    }
  };

  const testAuthService = () => {
    console.log('🔑 Auth service test');
    console.log('isAuthenticated:', authApiService.isAuthenticated());
    console.log('currentUser:', authApiService.getCurrentUserFromStorage());
    alert('Auth service test tamamlandı! Console\'u kontrol edin.');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Axios API Test Sayfası</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Temel API Test</h2>
          <p className="text-gray-600 mb-4">
            JSONPlaceholder API ile temel bağlantı testi
          </p>
          <button
            onClick={testBasicApi}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            API Test Yap
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Auth Service Test</h2>
          <p className="text-gray-600 mb-4">
            Authentication service'in çalışıp çalışmadığını test et
          </p>
          <button
            onClick={testAuthService}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Auth Test Yap
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Kurulum Bilgileri:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Axios yüklendi</li>
            <li>✅ API servisleri oluşturuldu</li>
            <li>✅ Hook'lar hazırlandı</li>
            <li>✅ Type definitions tanımlandı</li>
            <li>✅ Error handling eklendi</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Sonraki Adımlar:</h3>
          <ul className="text-sm space-y-1">
            <li>1. .env.example dosyasını .env olarak kopyalayın</li>
            <li>2. VITE_API_BASE_URL'i kendi API endpoint'inizle değiştirin</li>
            <li>3. API servislerini kendi ihtiyaçlarınıza göre özelleştirin</li>
            <li>4. components/examples/ApiExamples.tsx dosyasındaki örnekleri inceleyin</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleApiTest;
