// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Error Response Type
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

// User Types
export interface User {
  id: string; // JWT'de string olarak geliyor
  nameSurname: string;
  userName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'moderator';
  roles?: string[]; // JWT'den gelen roller
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  nameSurname: string;
  userName: string;
  email: string;
  password: string;
  phone?: string;
  isAdmin?: boolean;
  role?: 'admin' | 'user' | 'moderator';
}

export interface UpdateUserDto {
  nameSurname?: string;
  userName?: string;
  email?: string;
  phone?: string;
  isAdmin?: boolean;
  role?: 'admin' | 'user' | 'moderator';
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  nameSurname: string;
  userName: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  operationClaims?: number[]; // Selected operation claim IDs
  customRole?: string; // Custom role name for display
}

export interface AuthResponse {
  accessToken: {
    token: string;
    expirationDate: string;
  };
  refreshToken?: {
    token: string;
    expirationDate: string;
  };
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Generic API Request Types
export interface ApiRequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// Dashboard Statistics Types
export interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
}

// Product Types (örnek için)
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  images?: string[];
}
