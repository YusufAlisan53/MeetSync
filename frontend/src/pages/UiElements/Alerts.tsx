import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";

export default function Alerts() {
  return (
    <>
      <PageMeta
        title="Uyarılar - Toplantı Takip Sistemi"
        description="Toplantı Takip Sistemi için uyarılar sayfası"
      />
      <PageBreadcrumb pageTitle="Uyarılar" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Başarı Uyarısı">
          <Alert
            variant="success"
            title="Başarı Mesajı"
            message="Bu işlemi gerçekleştirirken dikkatli olun."
            showLink={true}
            linkHref="/"
            linkText="Daha fazla bilgi"
          />
          <Alert
            variant="success"
            title="Başarı Mesajı"
            message="Bu işlemi gerçekleştirirken dikkatli olun."
            showLink={false}
          />
        </ComponentCard>
        <ComponentCard title="Uyarı Mesajı">
          <Alert
            variant="warning"
            title="Uyarı Mesajı"
            message="Bu işlemi gerçekleştirirken dikkatli olun."
            showLink={true}
            linkHref="/"
            linkText="Daha fazla bilgi"
          />
          <Alert
            variant="warning"
            title="Uyarı Mesajı"
            message="Bu işlemi gerçekleştirirken dikkatli olun."
            showLink={false}
          />
        </ComponentCard>{" "}
        <ComponentCard title="Hata Uyarısı">
          <Alert
            variant="error"
            title="Hata Mesajı"
            message="Bu işlemi gerçekleştirirken dikkatli olun."
            showLink={true}
            linkHref="/"
            linkText="Daha fazla bilgi"
          />
          <Alert
            variant="error"
            title="Hata Mesajı"
            message="Bu işlemi gerçekleştirirken dikkatli olun."
            showLink={false}
          />
        </ComponentCard>{" "}
        <ComponentCard title="Bilgi Uyarısı">
          <Alert
            variant="info"
            title="Bilgi Mesajı"
            message="Bu işlemi gerçekleştirirken dikkatli olun."
            showLink={true}
            linkHref="/"
            linkText="Daha fazla bilgi"
          />
          <Alert
            variant="info"
            title="Bilgi Mesajı"
            message="Bu işlemi gerçekleştirirken dikkatli olun."
            showLink={false}
          />
        </ComponentCard>
      </div>
    </>
  );
}
