import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '../../icons';
import Checkbox from '../form/input/Checkbox';
import { formatOperationClaim, groupClaimsByCategory, categoryColors } from '../../utils/operationClaimMapping';
import type { OperationClaim } from '../../services/operationClaimApiService';

interface ExtendedOperationClaim extends OperationClaim {
  formatted: {
    displayName: string;
    description: string;
    category: string;
    color: string;
  };
}

interface AuthorizationSelectorProps {
  operationClaims: OperationClaim[];
  selectedClaims: number[];
  onClaimChange: (claimId: number, checked: boolean) => void;
  loading?: boolean;
}

export default function AuthorizationSelector({
  operationClaims,
  selectedClaims,
  onClaimChange,
  loading = false
}: AuthorizationSelectorProps) {
  // Default olarak önemli kategorileri açık başlat
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Kullanıcı Yönetimi': true,
    'Toplantı Yönetimi': true,
    'Salon Yönetimi': true
  });
  
  // Debug log'ları sadece development'ta
  // console.log("AuthorizationSelector props:", { 
  //   operationClaimsLength: operationClaims.length, 
  //   selectedClaimsLength: selectedClaims.length, 
  //   loading,
  //   operationClaims: operationClaims.slice(0, 3)
  // });
  
  // Yetkiler kategorilere göre grupla
  const groupedClaims = groupClaimsByCategory(operationClaims);
  const categories = Object.keys(groupedClaims);
  
  // console.log("Grouped claims:", { 
  //   groupedClaims, 
  //   categories, 
  //   categoriesLength: categories.length 
  // });

  // Kategori genişletme/kapatma
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Kategori için tümünü seç/hiçbirini seç
  const toggleCategorySelection = (category: string, selectAll: boolean) => {
    const categoryItems = groupedClaims[category];
    categoryItems.forEach((claim: any) => {
      const isSelected = selectedClaims.includes(claim.id);
      if (selectAll && !isSelected) {
        onClaimChange(claim.id, true);
      } else if (!selectAll && isSelected) {
        onClaimChange(claim.id, false);
      }
    });
  };

  // Kategori seçim durumu
  const getCategorySelectionState = (category: string) => {
    const categoryItems = groupedClaims[category];
    const selectedCount = categoryItems.filter((claim: any) => selectedClaims.includes(claim.id)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryItems.length) return 'all';
    return 'partial';
  };

  // Renk sınıfları
  const getColorClasses = (color: string) => {
    const colors = {
      red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
      blue: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
      green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
      purple: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400',
      orange: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400',
      gray: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400',
      teal: 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-400'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-500 dark:text-gray-400">Yetkiler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Genel İstatistik */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-800 dark:text-white">
              Seçilen Yetkiler
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedClaims.length} / {operationClaims.length} yetki seçildi
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                categories.forEach(category => {
                  toggleCategorySelection(category, true);
                });
              }}
              className="text-xs px-3 py-1 bg-brand-100 text-brand-700 rounded-full hover:bg-brand-200 transition-colors dark:bg-brand-900/50 dark:text-brand-400"
            >
              Tümünü Seç
            </button>
            <button
              type="button"
              onClick={() => {
                categories.forEach(category => {
                  toggleCategorySelection(category, false);
                });
              }}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-400"
            >
              Hiçbirini Seçme
            </button>
          </div>
        </div>
      </div>

      {/* Kategori Listesi */}
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
        {categories.map((category) => {
          const categoryItems = groupedClaims[category];
          const isExpanded = expandedCategories[category];
          const selectionState = getCategorySelectionState(category);
          const categoryColor = categoryColors[category as keyof typeof categoryColors] || 'gray';
          
          return (
            <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              {/* Kategori Başlığı */}
              <div className={`px-4 py-3 ${getColorClasses(categoryColor)} border-b border-gray-200 dark:border-gray-600`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex items-center space-x-2 text-sm font-medium hover:opacity-80 transition-opacity"
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                      <span>{category}</span>
                    </button>
                    <span className="text-xs opacity-75">
                      ({categoryItems.length} yetki)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Kategori seçim durumu */}
                    <div className="flex items-center">
                      {selectionState === 'all' && (
                        <span className="text-xs font-medium">Tümü seçili</span>
                      )}
                      {selectionState === 'partial' && (
                        <span className="text-xs font-medium">
                          {categoryItems.filter((claim: any) => selectedClaims.includes(claim.id)).length} seçili
                        </span>
                      )}
                      {selectionState === 'none' && (
                        <span className="text-xs opacity-75">Hiçbiri seçili değil</span>
                      )}
                    </div>
                    
                    {/* Kategori işlemleri */}
                    <div className="flex space-x-1">
                      {selectionState !== 'all' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategorySelection(category, true);
                          }}
                          className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                          title="Kategoriyi seç"
                        >
                          Seç
                        </button>
                      )}
                      {selectionState !== 'none' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategorySelection(category, false);
                          }}
                          className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                          title="Kategori seçimini kaldır"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kategori İçeriği */}
              {isExpanded && (
                <div className="p-4 bg-white dark:bg-gray-800/50">
                  <div className="grid grid-cols-1 gap-3">
                    {categoryItems.map((claim: any) => {
                      const isSelected = selectedClaims.includes(claim.id);
                      
                      return (
                        <label
                          key={claim.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group transition-colors"
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={(checked) => onClaimChange(claim.id, checked)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {claim.formatted.displayName}
                              </span>
                              {isSelected && (
                                <span className="text-xs px-2 py-1 bg-brand-100 text-brand-700 rounded-full dark:bg-brand-900/50 dark:text-brand-400">
                                  Seçili
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {claim.formatted.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                              {claim.name}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alt Bilgi */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-600 dark:text-blue-400">
          💡 <strong>İpucu:</strong> Kategorileri tıklayarak genişletebilir, her kategori için toplu seçim yapabilirsiniz. 
          Seçtiğiniz yetkiler kullanıcının sistem içerisinde hangi işlemleri yapabileceğini belirler.
        </p>
      </div>
    </div>
  );
}
