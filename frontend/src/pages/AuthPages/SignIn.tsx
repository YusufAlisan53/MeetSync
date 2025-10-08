import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Giriş Yap | Toplantı Takip Paneli"
        description="Toplantı Takip Sistemi giriş sayfası"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
