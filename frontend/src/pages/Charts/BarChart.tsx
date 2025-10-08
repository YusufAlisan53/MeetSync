import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import BarChartOne from "../../components/charts/bar/BarChartOne";
import PageMeta from "../../components/common/PageMeta";

export default function BarChart() {
  return (
    <div>
      <PageMeta
        title="Çubuk Grafik - Toplantı Takip Sistemi"
        description="Toplantı Takip Sistemi için çubuk grafik sayfası"
      />
      <PageBreadcrumb pageTitle="Çubuk Grafik" />
      <div className="space-y-6">
        <ComponentCard title="Çubuk Grafik 1">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
