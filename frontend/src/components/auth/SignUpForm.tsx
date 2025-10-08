import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import AuthorizationSelector from "../form/AuthorizationSelector";
import { authApiService, operationClaimApiService } from "../../services";
import { operationClaimMapping } from "../../utils/operationClaimMapping";
import type { RegisterCredentials } from "../../types/api";
import type { OperationClaim } from "../../services/operationClaimApiService";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [operationClaims, setOperationClaims] = useState<OperationClaim[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<number[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [formData, setFormData] = useState({
    nameSurname: "",
    userName: "",
    email: "",
    password: "",
    customRole: "",
  });
  
  const navigate = useNavigate();

  // Load operation claims on component mount
  useEffect(() => {
    const loadOperationClaims = async () => {
      try {
        setLoadingClaims(true);
        // console.log("Loading operation claims...");
        
        const response = await operationClaimApiService.getOperationClaimsForSelection();
        // console.log("Operation claims response:", response);
        
        if (response && response.items) {
          setOperationClaims(response.items);
          // console.log("Operation claims set:", response.items.length, "items");
        } else {
          // console.log("Response does not have items:", response);
          setOperationClaims([]);
        }
      } catch (err) {
        console.error("Failed to load operation claims:", err);
        setError("Yetki listesi yüklenemedi: " + (err as Error).message);
      } finally {
        setLoadingClaims(false);
      }
    };

    loadOperationClaims();
  }, []);

  // Auto-select default stock claims when operation claims are loaded
  useEffect(() => {
    if (operationClaims.length > 0 && selectedClaims.length === 0) {
      const stockClaimIds: number[] = [];
      
      operationClaims.forEach(claim => {
        const mapping = operationClaimMapping[claim.name];
        if (mapping && mapping.isDefaultSelected) {
          stockClaimIds.push(claim.id);
        }
      });
      
      // console.log("Auto-selecting stock claims:", stockClaimIds);
      setSelectedClaims(stockClaimIds);
    }
  }, [operationClaims]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClaimChange = (claimId: number, checked: boolean) => {
    if (checked) {
      setSelectedClaims(prev => [...prev, claimId]);
    } else {
      setSelectedClaims(prev => prev.filter(id => id !== claimId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.nameSurname || !formData.userName || !formData.email || !formData.password || !formData.customRole) {
      setError("Tüm alanlar zorunludur");
      return;
    }
    
    if (selectedClaims.length === 0) {
      setError("En az bir yetki seçmelisiniz");
      return;
    }

    setLoading(true);
    
    try {
      const credentials: RegisterCredentials = {
        nameSurname: formData.nameSurname,
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
        isAdmin: false,
        operationClaims: selectedClaims,
        customRole: formData.customRole
      };
      
      const result = await authApiService.createUser(credentials);
      
      console.log('Kullanıcı oluşturuldu:', result);
      
      // Kullanıcı başarıyla oluşturuldu mesajı
      alert(result.message);
      navigate("/signin", { 
        state: { 
          message: "Kayıt başarılı! Lütfen bilgilerinizle giriş yapın.",
          email: formData.email 
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Kayıt işlemi başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-7xl mx-auto mb-5 sm:pt-10">
        <Link
          to="/calendar"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Dashboard'a geri dön
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-7xl mx-auto">
        <div>
          <div className="mb-5 sm:mb-8 text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-lg dark:text-white/90 sm:text-title-xl">
              Kullanıcı Yönetimi
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Sisteme yeni kullanıcı ekleyin ve yetkilerini belirleyin
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}
            
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - User Information */}
              <div className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-xl dark:border-gray-700 bg-white dark:bg-gray-800/50">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/50 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Kullanıcı Bilgileri
                    </h2>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>
                          Ad Soyad<span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="nameSurname"
                          name="nameSurname"
                          value={formData.nameSurname}
                          onChange={handleInputChange}
                          placeholder="Ad ve soyadını girin"
                        />
                      </div>
                      <div>
                        <Label>
                          Kullanıcı Adı<span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="userName"
                          name="userName"
                          value={formData.userName}
                          onChange={handleInputChange}
                          placeholder="Kullanıcı adını girin"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>
                        E-posta<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="E-posta adresini girin"
                      />
                    </div>
                    
                    <div>
                      <Label>
                        Şifre<span className="text-error-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="Şifreyi girin"
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                        >
                          {showPassword ? (
                            <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                          ) : (
                            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label>
                        Özel Rol Adı<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="customRole"
                        name="customRole"
                        value={formData.customRole}
                        onChange={handleInputChange}
                        placeholder="Örn: Müdür, Koordinatör, Uzman..."
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Bu alan raporlarda ve kullanıcı listesinde görünecek
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Authorization */}
              <div className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-xl dark:border-gray-700 bg-white dark:bg-gray-800/50">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Yetkilendirme
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        En az bir yetki seçmelisiniz
                      </p>
                    </div>
                  </div>
                  
                  <AuthorizationSelector
                    operationClaims={operationClaims}
                    selectedClaims={selectedClaims}
                    onClaimChange={handleClaimChange}
                    loading={loadingClaims}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-8 space-y-6">
              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  type="submit"
                  disabled={loading || loadingClaims}
                  className="flex-1 flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Kullanıcı oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Kullanıcı Oluştur
                    </>
                  )}
                </button>
                <Link
                  to="/signin"
                  className="flex-shrink-0 px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
                >
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
