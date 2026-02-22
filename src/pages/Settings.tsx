import { Settings as SettingsIcon } from 'lucide-react';
import { DataManagement } from '@/components/DataManagement';

export default function Settings() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage your data and preferences</p>
      </div>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold mb-1">Data Management</h2>
        <p className="text-sm text-muted-foreground mb-4">Export, import, or clear your task data</p>
        <DataManagement />
      </section>
    </div>
  );
}
