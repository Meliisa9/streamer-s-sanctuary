import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Shield, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PrivacySettings {
  show_age: boolean;
  show_country: boolean;
  show_city: boolean;
  show_activity: boolean;
  show_connected_accounts: boolean;
  show_favorites: boolean;
}

const defaultSettings: PrivacySettings = {
  show_age: true,
  show_country: true,
  show_city: true,
  show_activity: true,
  show_connected_accounts: true,
  show_favorites: true,
};

export function PrivacyControls() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const profileData = profile as any;
    if (profileData?.privacy_settings && typeof profileData.privacy_settings === 'object') {
      setSettings({ ...defaultSettings, ...profileData.privacy_settings });
    }
  }, [profile]);

  const handleToggle = (key: keyof PrivacySettings) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return newSettings;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ privacy_settings: settings as any })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Privacy settings saved" });
      setHasChanges(false);
      refreshProfile();
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const privacyOptions = [
    { key: "show_age", label: "Age/Birthday", description: "Show your age on your public profile" },
    { key: "show_country", label: "Country", description: "Show your country on your public profile" },
    { key: "show_city", label: "City", description: "Show your city on your public profile" },
    { key: "show_activity", label: "Activity", description: "Show your recent activity (guesses, entries, votes)" },
    { key: "show_connected_accounts", label: "Connected Accounts", description: "Show linked Twitch, Discord, Kick accounts" },
    { key: "show_favorites", label: "Favorites", description: "Show your favorite slot and casino" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-sm text-muted-foreground">Control what others can see on your profile</p>
        </div>
        {hasChanges && (
          <Button size="sm" onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {privacyOptions.map((option, index) => (
          <motion.div
            key={option.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
              settings[option.key as keyof PrivacySettings]
                ? "bg-primary/5 border-primary/20"
                : "bg-secondary/30 border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              {settings[option.key as keyof PrivacySettings] ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <Label className="font-medium cursor-pointer">{option.label}</Label>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>
            <Switch
              checked={settings[option.key as keyof PrivacySettings]}
              onCheckedChange={() => handleToggle(option.key as keyof PrivacySettings)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
