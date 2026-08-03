import { PageHeader } from "@/components/shared/page-header";
import { SettingsView } from "./settings-view";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Business and staff configuration" />
      <SettingsView />
    </>
  );
}
