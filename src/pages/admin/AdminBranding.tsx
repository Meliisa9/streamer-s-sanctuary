import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Loader2, Type, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface BrandingSettings {
  site_name: string;
  site_tagline: string;
  site_title: string;
  favicon_url: string | null;
  logo_url: string | null;
  footer_copyright: string;
}

const defaultSettings: BrandingSettings = {
  site_name: "StreamerX",
  site_tagline: "Casino Streams",
  site_title: "StreamerX - Casino Streams",
  favicon_url: null,
  logo_url: null,
  footer_copyright: "",
};

export default function AdminBranding() {
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedSettings: BrandingSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof BrandingSettings;
        if (key in loadedSettings) {
          (loadedSettings as Record<string, any>)[key] = row.value ?? defaultSettings[key];
        }
      });

      setSettings(loadedSettings);
      if (loadedSettings.logo_url) setLogoPreview(loadedSettings.logo_url);
      if (loadedSettings.favicon_url) setFaviconPreview(loadedSettings.favicon_url);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    if (!isAdmin) {
      toast({ title: "Only admins can change settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      let logoUrl = settings.logo_url;
      let faviconUrl = settings.favicon_url;

      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("media").upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
        logoUrl = publicUrl;
      }

      if (faviconFile) {
        const fileExt = faviconFile.name.split(".").pop();
        const fileName = `favicon-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("media").upload(fileName, faviconFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
        faviconUrl = publicUrl;
      }

      const settingsToSave = { ...settings, logo_url: logoUrl, favicon_url: faviconUrl };

      for (const [key, value] of Object.entries(settingsToSave)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      toast({ title: "Branding settings saved" });
      setLogoFile(null);
      setFaviconFile(null);
      document.title = settingsToSave.site_title;
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding</h2>
          <p className="text-muted-foreground">Customize your site's branding and appearance</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Site Identity
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Site Name</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tagline</label>
              <input
                type="text"
                value={settings.site_tagline}
                onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Logo</label>
              <div className="mt-1 flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground text-xs">No logo</div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)} className="hidden" />
                  <Button variant="outline" type="button" asChild>
                    <span><Upload className="w-4 h-4 mr-2" />Upload Logo</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Browser Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Browser Tab Title</label>
              <input
                type="text"
                value={settings.site_title}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="StreamerX - Casino Streams"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Favicon</label>
              <div className="mt-1 flex items-center gap-4">
                {faviconPreview ? (
                  <img src={faviconPreview} alt="Favicon" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground text-xs">None</div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFaviconFile, setFaviconPreview)} className="hidden" />
                  <Button variant="outline" type="button" asChild>
                    <span><Upload className="w-4 h-4 mr-2" />Upload Favicon</span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Recommended: 32x32 or 64x64 PNG/ICO</p>
            </div>
            <div>
              <label className="text-sm font-medium">Footer Copyright Text</label>
              <input
                type="text"
                value={settings.footer_copyright}
                onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="© 2024 StreamerX. All rights reserved."
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
