import PageMeta from "../components/common/PageMeta";
import SignUpForm from "../components/auth/SignUpForm";

export default function UserManagement() {
  return (
    <>
      <PageMeta
        title="Kullanıcı Yönetimi | Toplantı Takip Paneli"
        description="Sistem kullanıcılarını yönetin ve yeni kullanıcı ekleyin"
      />
      <SignUpForm />
    </>
  );
}
