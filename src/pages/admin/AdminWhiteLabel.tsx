import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import { WhiteLabelSettings } from "@/components/admin/WhiteLabelSettings";

export default function AdminWhiteLabel() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="White Label Settings"
        description="Customize the complete look and feel of your platform"
      />
      <AdminSettingsNav />
      <WhiteLabelSettings />
    </div>
  );
}
