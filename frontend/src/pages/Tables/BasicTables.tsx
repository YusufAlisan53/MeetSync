import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Temel Tablolar - Toplantı Takip Sistemi"
        description="Toplantı Takip Sistemi için temel tablolar sayfası"
      />
      <PageBreadcrumb pageTitle="Temel Tablolar" />
      <div className="space-y-6">
        <ComponentCard title="Temel Tablo 1">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
