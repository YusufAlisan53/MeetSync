import React from "react";
import { useAuth } from "../../hooks/useAuth";

function UserMetaCard() {
  const { user, loading } = useAuth();

  // Debug için user verisini logla (sadece development'ta)
  // console.log('UserMetaCard - user data:', user);

  // Loading durumunda skeleton göster
  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="order-3 xl:order-2">
              <div className="mb-2 h-6 bg-gray-200 rounded animate-pulse w-48 dark:bg-gray-700"></div>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 dark:bg-gray-700"></div>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left transition-all duration-300">
              {user?.nameSurname || 'Kullanıcı Adı'}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.role === 'admin' ? 'Yönetici' : user?.role === 'moderator' ? 'Moderatör' : 'Kullanıcı'}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email ? user.email.split('@')[1] : 'Sistem Kullanıcısı'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(UserMetaCard);
