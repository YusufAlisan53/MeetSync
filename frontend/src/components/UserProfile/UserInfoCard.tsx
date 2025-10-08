import React from "react";
import { useAuth } from "../../hooks/useAuth";

function UserInfoCard() {
  const { user, loading } = useAuth();

  // Debug için user verisini logla (sadece development'ta)
  // console.log('UserInfoCard - user data:', user);

  // Loading durumunda skeleton göster
  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-40 mb-6 dark:bg-gray-700"></div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20 mb-2 dark:bg-gray-700"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32 dark:bg-gray-700"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Kişisel Bilgiler
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Ad Soyad
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.nameSurname || 'Kullanıcı Adı'}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Kullanıcı Adı
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.userName || 'kullaniciadi'}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                E-posta Adresi
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.email || 'kullanici@ornek.com'}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Rol
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.role === 'admin' ? 'Yönetici' : user?.role === 'moderator' ? 'Moderatör' : 'Kullanıcı'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(UserInfoCard);
