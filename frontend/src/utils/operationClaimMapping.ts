// Operation Claims'leri kullanıcı dostu isimlere çeviren mapping
export const operationClaimMapping: Record<string, { 
  displayName: string; 
  description: string; 
  category: string;
  color: string;
  isDefaultSelected: boolean; // Stock kullanıcıda varsayılan olarak seçili olacak mı
}> = {
  // Admin
  'Admin': { 
    displayName: 'Süper Yönetici', 
    description: 'Tüm sistem yetkilerine sahip olur',
    category: 'Sistem',
    color: 'red',
    isDefaultSelected: false
  },

  // Auth
  'Auth.Admin': { 
    displayName: 'Kimlik Doğrulama Yöneticisi', 
    description: 'Kimlik doğrulama işlemlerini yönetir',
    category: 'Kimlik Doğrulama',
    color: 'blue',
    isDefaultSelected: false
  },
  'Auth.Read': { 
    displayName: 'Kimlik Doğrulama Okuma', 
    description: 'Kimlik doğrulama bilgilerini görüntüler',
    category: 'Kimlik Doğrulama',
    color: 'blue',
    isDefaultSelected: false
  },
  'Auth.Write': { 
    displayName: 'Kimlik Doğrulama Yazma', 
    description: 'Kimlik doğrulama işlemlerini düzenler',
    category: 'Kimlik Doğrulama',
    color: 'blue',
    isDefaultSelected: false
  },
  'Auth.RevokeToken': { 
    displayName: 'Token İptal Etme', 
    description: 'Kullanıcı token\'larını iptal edebilir',
    category: 'Kimlik Doğrulama',
    color: 'blue',
    isDefaultSelected: false
  },

  // Users
  'Users.Admin': { 
    displayName: 'Kullanıcı Yöneticisi', 
    description: 'Tüm kullanıcı işlemlerini yönetir',
    category: 'Kullanıcı Yönetimi',
    color: 'green',
    isDefaultSelected: false
  },
  'Users.Read': { 
    displayName: 'Kullanıcı Görüntüleme', 
    description: 'Kullanıcı listesini ve detaylarını görüntüler',
    category: 'Kullanıcı Yönetimi',
    color: 'green',
    isDefaultSelected: true // Stock kullanıcı kendi profilini görebilmeli
  },
  'Users.Write': { 
    displayName: 'Kullanıcı Düzenleme', 
    description: 'Kullanıcı bilgilerini düzenler',
    category: 'Kullanıcı Yönetimi',
    color: 'green',
    isDefaultSelected: false
  },
  'Users.Create': { 
    displayName: 'Kullanıcı Ekleme', 
    description: 'Yeni kullanıcı hesabı oluşturur',
    category: 'Kullanıcı Yönetimi',
    color: 'green',
    isDefaultSelected: false
  },
  'Users.Update': { 
    displayName: 'Kullanıcı Güncelleme', 
    description: 'Mevcut kullanıcı bilgilerini günceller',
    category: 'Kullanıcı Yönetimi',
    color: 'green',
    isDefaultSelected: false
  },
  'Users.Delete': { 
    displayName: 'Kullanıcı Silme', 
    description: 'Kullanıcı hesaplarını siler',
    category: 'Kullanıcı Yönetimi',
    color: 'green',
    isDefaultSelected: false
  },

  // Meetings
  'Meetings.Admin': { 
    displayName: 'Toplantı Yöneticisi', 
    description: 'Tüm toplantı işlemlerini yönetir',
    category: 'Toplantı Yönetimi',
    color: 'purple',
    isDefaultSelected: false
  },
  'Meetings.Read': { 
    displayName: 'Toplantı Görüntüleme', 
    description: 'Toplantı listesini ve detaylarını görüntüler',
    category: 'Toplantı Yönetimi',
    color: 'purple',
    isDefaultSelected: true // Stock kullanıcı toplantıları görebilmeli
  },
  'Meetings.Write': { 
    displayName: 'Toplantı Düzenleme', 
    description: 'Toplantı bilgilerini düzenler',
    category: 'Toplantı Yönetimi',
    color: 'purple',
    isDefaultSelected: false
  },
  'Meetings.Create': { 
    displayName: 'Toplantı Oluşturma', 
    description: 'Yeni toplantı planlar',
    category: 'Toplantı Yönetimi',
    color: 'purple',
    isDefaultSelected: true // Stock kullanıcı toplantı oluşturabilmeli
  },
  'Meetings.Update': { 
    displayName: 'Toplantı Güncelleme', 
    description: 'Mevcut toplantıları günceller',
    category: 'Toplantı Yönetimi',
    color: 'purple',
    isDefaultSelected: true // Stock kullanıcı kendi toplantılarını güncelleyebilmeli
  },
  'Meetings.Delete': { 
    displayName: 'Toplantı Silme', 
    description: 'Toplantıları iptal eder/siler',
    category: 'Toplantı Yönetimi',
    color: 'purple',
    isDefaultSelected: true // Stock kullanıcı kendi toplantılarını silebilmeli
  },
  'Meetings.Approve': { 
    displayName: 'Toplantı Onaylama', 
    description: 'Toplantı taleplerini onaylar',
    category: 'Toplantı Yönetimi',
    color: 'purple',
    isDefaultSelected: false // Bu admin yetkisi, davet onaylama değil
  },

  // Meeting Users
  'MeetingUsers.Admin': { 
    displayName: 'Toplantı Katılımcı Yöneticisi', 
    description: 'Toplantı katılımcı işlemlerini yönetir',
    category: 'Toplantı Katılımcı Yönetimi',
    color: 'indigo',
    isDefaultSelected: false
  },
  'MeetingUsers.Read': { 
    displayName: 'Katılımcı Görüntüleme', 
    description: 'Toplantı katılımcılarını görüntüler',
    category: 'Toplantı Katılımcı Yönetimi',
    color: 'indigo',
    isDefaultSelected: true // Stock kullanıcı kimlerle toplantı yaptığını görebilmeli
  },
  'MeetingUsers.Write': { 
    displayName: 'Katılımcı Düzenleme', 
    description: 'Toplantı katılımcılarını düzenler',
    category: 'Toplantı Katılımcı Yönetimi',
    color: 'indigo',
    isDefaultSelected: false
  },
  'MeetingUsers.Create': { 
    displayName: 'Katılımcı Ekleme', 
    description: 'Toplantıya katılımcı ekler',
    category: 'Toplantı Katılımcı Yönetimi',
    color: 'indigo',
    isDefaultSelected: true // Stock kullanıcı kendi toplantılarına katılımcı ekleyebilmeli
  },
  'MeetingUsers.Update': { 
    displayName: 'Katılımcı Güncelleme', 
    description: 'Katılımcı bilgilerini günceller - DAVET ONAYLAMA',
    category: 'Toplantı Katılımcı Yönetimi',
    color: 'indigo',
    isDefaultSelected: true // Stock kullanıcı davet onaylama/reddetme yapabilmeli
  },
  'MeetingUsers.Delete': { 
    displayName: 'Katılımcı Silme', 
    description: 'Toplantıdan katılımcı çıkarır',
    category: 'Toplantı Katılımcı Yönetimi',
    color: 'indigo',
    isDefaultSelected: true // Stock kullanıcı kendi toplantılarından katılımcı çıkarabilmeli
  },

  // Rooms
  'Rooms.Admin': { 
    displayName: 'Toplantı Salonu Yöneticisi', 
    description: 'Tüm salon işlemlerini yönetir',
    category: 'Salon Yönetimi',
    color: 'orange',
    isDefaultSelected: false
  },
  'Rooms.Read': { 
    displayName: 'Salon Görüntüleme', 
    description: 'Salon listesi ve detaylarını görüntüler',
    category: 'Salon Yönetimi',
    color: 'orange',
    isDefaultSelected: true // Stock kullanıcı hangi salonların müsait olduğunu görebilmeli
  },
  'Rooms.Write': { 
    displayName: 'Salon Düzenleme', 
    description: 'Salon bilgilerini düzenler',
    category: 'Salon Yönetimi',
    color: 'orange',
    isDefaultSelected: false
  },
  'Rooms.Create': { 
    displayName: 'Salon Ekleme', 
    description: 'Yeni toplantı salonu ekler',
    category: 'Salon Yönetimi',
    color: 'orange',
    isDefaultSelected: false
  },
  'Rooms.Update': { 
    displayName: 'Salon Güncelleme', 
    description: 'Mevcut salon bilgilerini günceller',
    category: 'Salon Yönetimi',
    color: 'orange',
    isDefaultSelected: false
  },
  'Rooms.Delete': { 
    displayName: 'Salon Silme', 
    description: 'Toplantı salonlarını siler',
    category: 'Salon Yönetimi',
    color: 'orange',
    isDefaultSelected: false
  },

  // Operation Claims
  'OperationClaims.Admin': { 
    displayName: 'Yetki Yöneticisi', 
    description: 'Sistem yetkilerini yönetir',
    category: 'Yetki Yönetimi',
    color: 'gray',
    isDefaultSelected: false
  },
  'OperationClaims.Read': { 
    displayName: 'Yetki Görüntüleme', 
    description: 'Sistem yetkilerini görüntüler',
    category: 'Yetki Yönetimi',
    color: 'gray',
    isDefaultSelected: false
  },
  'OperationClaims.Write': { 
    displayName: 'Yetki Düzenleme', 
    description: 'Sistem yetkilerini düzenler',
    category: 'Yetki Yönetimi',
    color: 'gray',
    isDefaultSelected: false
  },
  'OperationClaims.Create': { 
    displayName: 'Yetki Oluşturma', 
    description: 'Yeni sistem yetkisi oluşturur',
    category: 'Yetki Yönetimi',
    color: 'gray',
    isDefaultSelected: false
  },
  'OperationClaims.Update': { 
    displayName: 'Yetki Güncelleme', 
    description: 'Mevcut yetkilerini günceller',
    category: 'Yetki Yönetimi',
    color: 'gray',
    isDefaultSelected: false
  },
  'OperationClaims.Delete': { 
    displayName: 'Yetki Silme', 
    description: 'Sistem yetkilerini siler',
    category: 'Yetki Yönetimi',
    color: 'gray',
    isDefaultSelected: false
  },

  // User Operation Claims
  'UserOperationClaims.Admin': { 
    displayName: 'Kullanıcı Yetki Yöneticisi', 
    description: 'Kullanıcı yetkilerini yönetir',
    category: 'Kullanıcı Yetki Yönetimi',
    color: 'teal',
    isDefaultSelected: false
  },
  'UserOperationClaims.Read': { 
    displayName: 'Kullanıcı Yetki Görüntüleme', 
    description: 'Kullanıcı yetkilerini görüntüler',
    category: 'Kullanıcı Yetki Yönetimi',
    color: 'teal',
    isDefaultSelected: false
  },
  'UserOperationClaims.Write': { 
    displayName: 'Kullanıcı Yetki Düzenleme', 
    description: 'Kullanıcı yetkilerini düzenler',
    category: 'Kullanıcı Yetki Yönetimi',
    color: 'teal',
    isDefaultSelected: false
  },
  'UserOperationClaims.Create': { 
    displayName: 'Kullanıcı Yetki Ekleme', 
    description: 'Kullanıcıya yetki ekler',
    category: 'Kullanıcı Yetki Yönetimi',
    color: 'teal',
    isDefaultSelected: false
  },
  'UserOperationClaims.Update': { 
    displayName: 'Kullanıcı Yetki Güncelleme', 
    description: 'Kullanıcı yetkilerini günceller',
    category: 'Kullanıcı Yetki Yönetimi',
    color: 'teal',
    isDefaultSelected: false
  },
  'UserOperationClaims.Delete': { 
    displayName: 'Kullanıcı Yetki Silme', 
    description: 'Kullanıcıdan yetki kaldırır',
    category: 'Kullanıcı Yetki Yönetimi',
    color: 'teal',
    isDefaultSelected: false
  }
};

// Kategorilere göre renkler
export const categoryColors = {
  'Sistem': 'red',
  'Kimlik Doğrulama': 'blue',
  'Kullanıcı Yönetimi': 'green',
  'Toplantı Yönetimi': 'purple',
  'Toplantı Katılımcı Yönetimi': 'indigo',
  'Salon Yönetimi': 'orange',
  'Yetki Yönetimi': 'gray',
  'Kullanıcı Yetki Yönetimi': 'teal'
};

// Operation claim'i kullanıcı dostu formata çevir
export function formatOperationClaim(claimName: string) {
  const mapping = operationClaimMapping[claimName];
  
  if (mapping) {
    return mapping;
  }
  
  // Eğer mapping yoksa, orijinal isimden parse et
  const parts = claimName.split('.');
  const category = parts[0];
  const action = parts[1] || claimName;
  
  return {
    displayName: action.charAt(0).toUpperCase() + action.slice(1),
    description: `${category} modülü için ${action.toLowerCase()} yetkisi`,
    category: category,
    color: 'gray'
  };
}

// Kategoriye göre yetkiler gruplama
export function groupClaimsByCategory(claims: any[]) {
  // console.log("groupClaimsByCategory called with:", claims);
  
  const grouped = claims.reduce((groups, claim) => {
    // console.log("Processing claim:", claim);
    const formatted = formatOperationClaim(claim.name);
    // console.log("Formatted claim:", formatted);
    const category = formatted.category;
    
    if (!groups[category]) {
      groups[category] = [];
    }
    
    groups[category].push({
      ...claim,
      formatted
    });
    
    return groups;
  }, {} as Record<string, any[]>);
  
  // console.log("Final grouped claims:", grouped);
  return grouped;
}

// Stock kullanıcı için varsayılan yetkileri döndürür
export function getDefaultSelectedClaims(): string[] {
  const defaultClaims: string[] = [];
  
  for (const [claimName, mapping] of Object.entries(operationClaimMapping)) {
    if (mapping.isDefaultSelected) {
      defaultClaims.push(claimName);
    }
  }
  
  return defaultClaims;
}

// Bir yetki grubunun varsayılan seçili olup olmadığını kontrol eder
export function isDefaultSelectedClaim(claimName: string): boolean {
  const mapping = operationClaimMapping[claimName];
  return mapping ? mapping.isDefaultSelected : false;
}
