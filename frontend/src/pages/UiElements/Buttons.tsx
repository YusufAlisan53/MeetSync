import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { BoxIcon } from "../../icons";

export default function Buttons() {
  return (
    <div>
      <PageMeta
        title="Butonlar - Toplantı Takip Sistemi"
        description="Toplantı Takip Sistemi için butonlar sayfası"
      />
      <PageBreadcrumb pageTitle="Butonlar" />
      <div className="space-y-5 sm:space-y-6">
        {/* Primary Button */}
        <ComponentCard title="Ana Buton">
          <div className="flex items-center gap-5">
            <Button size="sm" variant="primary">
              Buton Metni
            </Button>
            <Button size="md" variant="primary">
              Buton Metni
            </Button>
          </div>
        </ComponentCard>
        {/* Primary Button with Start Icon */}
        <ComponentCard title="Sol İkonlu Ana Buton">
          <div className="flex items-center gap-5">
            <Button
              size="sm"
              variant="primary"
              startIcon={<BoxIcon className="size-5" />}
            >
              Buton Metni
            </Button>
            <Button
              size="md"
              variant="primary"
              startIcon={<BoxIcon className="size-5" />}
            >
              Buton Metni
            </Button>
          </div>
        </ComponentCard>
        {/* Primary Button with Start Icon */}
        <ComponentCard title="Sağ İkonlu Ana Buton">
          <div className="flex items-center gap-5">
            <Button
              size="sm"
              variant="primary"
              endIcon={<BoxIcon className="size-5" />}
            >
              Buton Metni
            </Button>
            <Button
              size="md"
              variant="primary"
              endIcon={<BoxIcon className="size-5" />}
            >
              Buton Metni
            </Button>
          </div>
        </ComponentCard>
        {/* Outline Button */}
        <ComponentCard title="İkincil Buton">
          <div className="flex items-center gap-5">
            {/* Outline Button */}
            <Button size="sm" variant="outline">
              Buton Metni
            </Button>
            <Button size="md" variant="outline">
              Buton Metni
            </Button>
          </div>
        </ComponentCard>
        {/* Outline Button with Start Icon */}
        <ComponentCard title="Sol İkonlu Çerçeveli Buton">
          <div className="flex items-center gap-5">
            <Button
              size="sm"
              variant="outline"
              startIcon={<BoxIcon className="size-5" />}
            >
              Buton Metni
            </Button>
            <Button
              size="md"
              variant="outline"
              startIcon={<BoxIcon className="size-5" />}
            >
              Buton Metni
            </Button>
          </div>
        </ComponentCard>{" "}
        {/* Outline Button with Start Icon */}
        <ComponentCard title="Sağ İkonlu Çerçeveli Buton">
          <div className="flex items-center gap-5">
            <Button
              size="sm"
              variant="outline"
              endIcon={<BoxIcon className="size-5" />}
            >
              Buton Metni
            </Button>
            <Button
              size="md"
              variant="outline"
              endIcon={<BoxIcon className="size-5" />}
            >
              Buton Metni
            </Button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
