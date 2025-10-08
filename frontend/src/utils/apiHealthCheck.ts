import apiClient from './axios';

/**
 * API Health Check Utility
 * Backend API'nin durumunu kontrol eder
 */
export class ApiHealthCheck {
  /**
   * Backend API'nin çalışıp çalışmadığını kontrol et
   */
  static async checkApiHealth(): Promise<{
    isHealthy: boolean;
    endpoints: {
      name: string;
      url: string;
      status: 'success' | 'error' | 'not_found';
      message: string;
    }[];
  }> {
    const endpointsToCheck = [
      { name: 'Auth Health', url: '/Auth/health' },
      { name: 'Auth Login', url: '/Auth/Login' },
      { name: 'Users', url: '/Users?PageIndex=0&PageSize=1' },
      { name: 'Meetings', url: '/Meetings?PageIndex=0&PageSize=1' },
      { name: 'Pending Meetings', url: '/Meetings/pending?PageIndex=0&PageSize=1' },
      { name: 'Rooms', url: '/Rooms?PageIndex=0&PageSize=1' },
      { name: 'MeetingUsers', url: '/MeetingUsers?PageIndex=0&PageSize=1' },
    ];

    const results = [];
    let healthyCount = 0;

    for (const endpoint of endpointsToCheck) {
      try {
        console.log(`🔍 Testing endpoint: ${endpoint.name} - ${endpoint.url}`);
        
        const response = await apiClient.get(endpoint.url);
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'success' as const,
          message: `✅ OK (${response.status})`
        });
        healthyCount++;
        
        console.log(`✅ ${endpoint.name}: SUCCESS`);
      } catch (error: any) {
        let status: 'error' | 'not_found' = 'error';
        let message = '❌ Error';
        
        if (error.response) {
          const statusCode = error.response.status;
          
          if (statusCode === 404) {
            status = 'not_found';
            message = `🔍 Not Found (${statusCode}) - Endpoint may not be implemented`;
          } else if (statusCode === 401) {
            message = `🔐 Unauthorized (${statusCode}) - Authentication required`;
          } else if (statusCode === 500) {
            message = `🔥 Internal Server Error (${statusCode}) - Backend issue`;
          } else {
            message = `❌ HTTP ${statusCode}: ${error.response.data?.message || 'Unknown error'}`;
          }
        } else if (error.request) {
          message = '🌐 Network Error - Backend may be down';
        } else {
          message = `❌ ${error.message}`;
        }
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status,
          message
        });
        
        console.log(`❌ ${endpoint.name}: ${message}`);
      }
    }

    const isHealthy = healthyCount > endpointsToCheck.length / 2;

    console.log(`\n🏥 API Health Check Summary:`);
    console.log(`📊 Healthy endpoints: ${healthyCount}/${endpointsToCheck.length}`);
    console.log(`🎯 Overall health: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);

    return {
      isHealthy,
      endpoints: results
    };
  }

  /**
   * Specific endpoint'leri test et
   */
  static async testPendingApprovalsEndpoints(userId: string) {
    console.log('\n🔍 Testing Pending Approvals Endpoints...');
    
    const endpointsToTest = [
      `/Meetings/pending?PageIndex=0&PageSize=100`,
      `/MeetingUsers/pending-approvals/${userId}?PageIndex=0&PageSize=100`,
      `/Rooms?PageIndex=0&PageSize=100`,
      `/Notifications/user/${userId}?PageIndex=0&PageSize=50`,
      `/Notifications/unread-count/${userId}`
    ];

    for (const endpoint of endpointsToTest) {
      try {
        console.log(`🚀 Testing: ${endpoint}`);
        const response = await apiClient.get(endpoint);
        console.log(`✅ Success:`, {
          status: response.status,
          dataType: Array.isArray(response.data) ? 'Array' : typeof response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
          sample: Array.isArray(response.data) ? response.data.slice(0, 1) : response.data
        });
      } catch (error: any) {
        console.log(`❌ Failed:`, {
          endpoint,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          details: error.response?.data
        });
      }
    }
  }

  /**
   * Test with authentication
   */
  static async testWithAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('⚠️ No auth token found. Please login first.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      await this.testPendingApprovalsEndpoints(user.id);
    }
  }
}

// Global window objesi üzerinden erişim için
if (typeof window !== 'undefined') {
  (window as any).apiHealthCheck = ApiHealthCheck;
}

export default ApiHealthCheck;
