"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CONNECTION_PROVIDERS } from "@/lib/skills";

interface SettingsViewProps {
  email: string;
  fullName: string;
  initialEmailWhenReady: boolean;
  initialRetentionDays: 30 | 90 | 180;
  connections: { provider: string; status: string }[];
}

export function SettingsView({
  email,
  fullName,
  initialEmailWhenReady,
  initialRetentionDays,
  connections,
}: SettingsViewProps) {
  const [emailWhenReady, setEmailWhenReady] = useState(initialEmailWhenReady);
  const [retention, setRetention] = useState<"30" | "90" | "180">(
    String(initialRetentionDays) as "30" | "90" | "180"
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingRetention, setSavingRetention] = useState(false);

  async function savePreferences(next: { email_when_ready: boolean; retention_days: number }) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      data: { preferences: next },
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: error.message,
      });
    }
  }

  async function handleEmailToggle(checked: boolean) {
    setSavingPrefs(true);
    setEmailWhenReady(checked);
    await savePreferences({
      email_when_ready: checked,
      retention_days: Number(retention),
    });
    setSavingPrefs(false);
  }

  async function handleRetentionChange(value: string) {
    setSavingRetention(true);
    const cast = value as "30" | "90" | "180";
    setRetention(cast);
    await savePreferences({
      email_when_ready: emailWhenReady,
      retention_days: Number(cast),
    });
    setSavingRetention(false);
  }

  function handleConnect(label: string) {
    toast({
      title: "Coming soon",
      description: `${label} connections ship in v1.1.`,
    });
  }

  const connectionStatus = (provider: string) =>
    connections.find((c) => c.provider === provider)?.status ?? "disconnected";

  return (
    <div className="space-y-8">
      <SettingsSection title="Profile" description="Pulled from your sign-in.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-dsg-gray-500">Name</Label>
            <p className="mt-1 text-sm text-dsg-gray-900">
              {fullName || <span className="text-dsg-gray-500">Not set</span>}
            </p>
          </div>
          <div>
            <Label className="text-xs text-dsg-gray-500">Email</Label>
            <p className="mt-1 text-sm text-dsg-gray-900">{email}</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Connections"
        description="Link your CRM and email so the dossier pulls real prior touchpoints."
      >
        <div className="space-y-6">
          <ConnectionGroup
            label="CRM"
            providers={CONNECTION_PROVIDERS.filter((p) => p.category === "crm")}
            statusFor={connectionStatus}
            onConnect={handleConnect}
          />
          <ConnectionGroup
            label="Email"
            providers={CONNECTION_PROVIDERS.filter((p) => p.category === "email")}
            statusFor={connectionStatus}
            onConnect={handleConnect}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        description="Choose what we send when a job finishes."
      >
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-md">
            <p className="text-sm font-medium text-dsg-gray-900">
              Email me when a dossier is ready
            </p>
            <p className="text-xs text-dsg-gray-500 mt-1">
              Useful when you start a job and close the tab. Off by default.
            </p>
          </div>
          <Switch
            checked={emailWhenReady}
            disabled={savingPrefs}
            onCheckedChange={handleEmailToggle}
            aria-label="Email me when a dossier is ready"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Output retention"
        description="How long we keep the .docx files in your account."
      >
        <RadioGroup
          value={retention}
          onValueChange={handleRetentionChange}
          className="space-y-3"
          aria-disabled={savingRetention}
        >
          <RetentionRow value="30" label="30 days" />
          <RetentionRow value="90" label="90 days (default)" />
          <RetentionRow value="180" label="180 days" />
        </RadioGroup>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dsg-card">
      <div className="p-6 border-b border-dsg-gray-200">
        <h2 className="dsg-section-header text-base">{title}</h2>
        <p className="text-xs text-dsg-gray-500 mt-1">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ConnectionGroup({
  label,
  providers,
  statusFor,
  onConnect,
}: {
  label: string;
  providers: { id: string; label: string }[];
  statusFor: (provider: string) => string;
  onConnect: (label: string) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-dsg-gray-500 mb-3">
        {label}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {providers.map((p) => {
          const status = statusFor(p.id);
          const connected = status === "connected";
          return (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border border-dsg-gray-200 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-dsg-gray-900 truncate">
                  {p.label}
                </p>
                <p className="text-xs text-dsg-gray-500 mt-0.5">
                  {connected ? "Connected" : "Not connected"}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onConnect(p.label)}
              >
                {connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RetentionRow({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <RadioGroupItem value={value} id={`retention-${value}`} />
      <Label htmlFor={`retention-${value}`} className="text-sm">
        {label}
      </Label>
    </div>
  );
}
