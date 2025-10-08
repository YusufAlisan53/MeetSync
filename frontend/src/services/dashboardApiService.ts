import { BaseApiService } from './BaseApiService';
import type { DashboardStats } from '../types/api';

/**
 * Dashboard API Service
 */
class DashboardApiService extends BaseApiService {
  constructor() {
    super('/dashboard');
  }

  /**
   * Dashboard istatistiklerini getir
   */
  async getStats(): Promise<DashboardStats> {
    return this.customGet<DashboardStats>('/stats');
  }

  /**
   * Gelir grafiği verilerini getir
   */
  async getRevenueChart(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    labels: string[];
    data: number[];
  }> {
    return this.customGet<{
      labels: string[];
      data: number[];
    }>(`/revenue-chart?period=${period}`);
  }

  /**
   * Kullanıcı büyüme grafiği verilerini getir
   */
  async getUserGrowthChart(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    labels: string[];
    data: number[];
  }> {
    return this.customGet<{
      labels: string[];
      data: number[];
    }>(`/user-growth-chart?period=${period}`);
  }

  /**
   * Satış grafiği verilerini getir
   */
  async getSalesChart(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  }> {
    return this.customGet<{
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
      }>;
    }>(`/sales-chart?period=${period}`);
  }

  /**
   * En çok satan ürünleri getir
   */
  async getTopProducts(limit: number = 5): Promise<Array<{
    id: number;
    name: string;
    sales: number;
    revenue: number;
    image?: string;
  }>> {
    return this.customGet<Array<{
      id: number;
      name: string;
      sales: number;
      revenue: number;
      image?: string;
    }>>(`/top-products?limit=${limit}`);
  }

  /**
   * Son aktiviteleri getir
   */
  async getRecentActivities(limit: number = 10): Promise<Array<{
    id: number;
    type: 'user_registered' | 'order_placed' | 'payment_received' | 'product_added';
    message: string;
    user?: {
      id: number;
      name: string;
    };
    createdAt: string;
  }>> {
    return this.customGet<Array<{
      id: number;
      type: 'user_registered' | 'order_placed' | 'payment_received' | 'product_added';
      message: string;
      user?: {
        id: number;
        name: string;
      };
      createdAt: string;
    }>>(`/recent-activities?limit=${limit}`);
  }

  /**
   * Trafik kaynaklarını getir
   */
  async getTrafficSources(): Promise<{
    direct: number;
    organic: number;
    referral: number;
    social: number;
    email: number;
    paid: number;
  }> {
    return this.customGet<{
      direct: number;
      organic: number;
      referral: number;
      social: number;
      email: number;
      paid: number;
    }>('/traffic-sources');
  }

  /**
   * Coğrafi dağılım verilerini getir
   */
  async getGeographicData(): Promise<Array<{
    country: string;
    countryCode: string;
    users: number;
    revenue: number;
  }>> {
    return this.customGet<Array<{
      country: string;
      countryCode: string;
      users: number;
      revenue: number;
    }>>('/geographic-data');
  }

  /**
   * Cihaz istatistiklerini getir
   */
  async getDeviceStats(): Promise<{
    desktop: number;
    mobile: number;
    tablet: number;
  }> {
    return this.customGet<{
      desktop: number;
      mobile: number;
      tablet: number;
    }>('/device-stats');
  }

  /**
   * Konversiyon oranları
   */
  async getConversionRates(): Promise<{
    visitToSignup: number;
    signupToPurchase: number;
    overallConversion: number;
  }> {
    return this.customGet<{
      visitToSignup: number;
      signupToPurchase: number;
      overallConversion: number;
    }>('/conversion-rates');
  }
}

// Singleton instance
export const dashboardApiService = new DashboardApiService();
export default dashboardApiService;
