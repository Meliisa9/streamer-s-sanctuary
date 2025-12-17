import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Loader2, Type, Globe, Palette, RotateCcw, Plus, Trash2, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BrandingSettings {
  site_name: string;
  site_tagline: string;
  site_title: string;
  favicon_url: string | null;
  logo_url: string | null;
  footer_copyright: string;
  theme_primary: string;
  theme_background: string;
  theme_card: string;
  theme_accent: string;
}

interface SocialLink {
  id: string;
  title: string;
  url: string;
  icon: string;
}

const defaultSettings: BrandingSettings = {
  site_name: "StreamerX",
  site_tagline: "Casino Streams",
  site_title: "StreamerX - Casino Streams",
  favicon_url: null,
  logo_url: null,
  footer_copyright: "",
  theme_primary: "262 83% 58%",
  theme_background: "240 10% 4%",
  theme_card: "240 10% 6%",
  theme_accent: "280 100% 70%",
};

const defaultTheme = {
  theme_primary: "262 83% 58%",
  theme_background: "240 10% 4%",
  theme_card: "240 10% 6%",
  theme_accent: "280 100% 70%",
};

const availableIcons = [
  { value: "twitter", label: "Twitter/X" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "discord", label: "Discord" },
  { value: "twitch", label: "Twitch" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "reddit", label: "Reddit" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "snapchat", label: "Snapchat" },
  { value: "pinterest", label: "Pinterest" },
  { value: "spotify", label: "Spotify" },
  { value: "kick", label: "Kick" },
  { value: "patreon", label: "Patreon" },
  { value: "mail", label: "Email" },
  { value: "globe", label: "Website" },
  { value: "link", label: "Link" },
];

export default function AdminBranding() {
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
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
      let loadedSocialLinks: SocialLink[] = [];
      
      data?.forEach((row) => {
        if (row.key === "footer_social_links" && row.value) {
          loadedSocialLinks = Array.isArray(row.value) ? (row.value as unknown as SocialLink[]) : [];
        } else {
          const key = row.key as keyof BrandingSettings;
          if (key in loadedSettings) {
            (loadedSettings as Record<string, any>)[key] = row.value ?? defaultSettings[key];
          }
        }
      });

      setSettings(loadedSettings);
      setSocialLinks(loadedSocialLinks.length > 0 ? loadedSocialLinks : [
        { id: "1", title: "Twitter", url: "#", icon: "twitter" },
        { id: "2", title: "YouTube", url: "#", icon: "youtube" },
        { id: "3", title: "Discord", url: "#", icon: "discord" },
      ]);
      
      if (loadedSettings.logo_url) setLogoPreview(loadedSettings.logo_url);
      if (loadedSettings.favicon_url) setFaviconPreview(loadedSettings.favicon_url);
      
      // Apply theme colors
      applyThemeColors(loadedSettings);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeColors = (themeSettings: BrandingSettings) => {
    const root = document.documentElement;
    if (themeSettings.theme_primary) root.style.setProperty("--primary", themeSettings.theme_primary);
    if (themeSettings.theme_background) root.style.setProperty("--background", themeSettings.theme_background);
    if (themeSettings.theme_card) root.style.setProperty("--card", themeSettings.theme_card);
    if (themeSettings.theme_accent) root.style.setProperty("--accent", themeSettings.theme_accent);
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

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { id: Date.now().toString(), title: "", url: "", icon: "globe" }]);
  };

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter(link => link.id !== id));
  };

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string) => {
    setSocialLinks(socialLinks.map(link => link.id === id ? { ...link, [field]: value } : link));
  };

  const resetThemeToDefault = async () => {
    setSettings({ ...settings, ...defaultTheme });
    applyThemeColors({ ...settings, ...defaultTheme });
    setShowResetDialog(false);
    toast({ title: "Theme reset to default" });
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

      // Save social links
      await supabase.from("site_settings").upsert({ key: "footer_social_links", value: socialLinks as any }, { onConflict: "key" });

      applyThemeColors(settingsToSave);
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

  const handleColorChange = (key: keyof BrandingSettings, hexColor: string) => {
    // Convert hex to HSL
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    const hslString = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    setSettings({ ...settings, [key]: hslString });
    
    // Apply immediately for preview
    const root = document.documentElement;
    const cssVar = key.replace("theme_", "--");
    root.style.setProperty(cssVar, hslString);
  };

  const hslToHex = (hsl: string): string => {
    const parts = hsl.split(" ");
    if (parts.length !== 3) return "#7c3aed";
    
    const h = parseInt(parts[0]) / 360;
    const s = parseInt(parts[1]) / 100;
    const l = parseInt(parts[2]) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
      <AdminSettingsNav />
      
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
        {/* Site Identity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Site Identity
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Site Name</Label>
              <Input
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input
                value={settings.site_tagline}
                onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                    <Type className="w-6 h-6" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)} className="hidden" />
                    <Button variant="outline" type="button" asChild size="sm">
                      <span><Upload className="w-4 h-4 mr-2" />Upload</span>
                    </Button>
                  </label>
                  {(logoPreview || settings.logo_url) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoFile(null);
                        setSettings({ ...settings, logo_url: null });
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Remove logo to show text-only header</p>
            </div>
          </div>
        </motion.div>

        {/* Browser Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Browser Settings
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Browser Tab Title</Label>
              <Input
                value={settings.site_title}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                placeholder="StreamerX - Casino Streams"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Favicon</Label>
              <div className="mt-2 flex items-center gap-4">
                {faviconPreview ? (
                  <img src={faviconPreview} alt="Favicon" className="w-10 h-10 rounded object-cover border border-border" />
                ) : (
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                    <Globe className="w-4 h-4" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFaviconFile, setFaviconPreview)} className="hidden" />
                  <Button variant="outline" type="button" asChild size="sm">
                    <span><Upload className="w-4 h-4 mr-2" />Upload</span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Recommended: 32x32 or 64x64 PNG/ICO</p>
            </div>
            <div>
              <Label>Footer Copyright Text</Label>
              <Input
                value={settings.footer_copyright}
                onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
                placeholder="© 2024 StreamerX. All rights reserved."
                className="mt-1"
              />
            </div>
          </div>
        </motion.div>

        {/* Theme Colors */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Theme Colors
            </h3>
            <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={hslToHex(settings.theme_primary)}
                  onChange={(e) => handleColorChange("theme_primary", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={hslToHex(settings.theme_primary)}
                  onChange={(e) => handleColorChange("theme_primary", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={hslToHex(settings.theme_accent)}
                  onChange={(e) => handleColorChange("theme_accent", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={hslToHex(settings.theme_accent)}
                  onChange={(e) => handleColorChange("theme_accent", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Background Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={hslToHex(settings.theme_background)}
                  onChange={(e) => handleColorChange("theme_background", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={hslToHex(settings.theme_background)}
                  onChange={(e) => handleColorChange("theme_background", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Card Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={hslToHex(settings.theme_card)}
                  onChange={(e) => handleColorChange("theme_card", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={hslToHex(settings.theme_card)}
                  onChange={(e) => handleColorChange("theme_card", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground">
              Changes preview instantly. Click "Save Changes" to persist.
            </p>
          </div>
        </motion.div>

        {/* Footer Social Links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Footer Social Links
            </h3>
            <Button variant="outline" size="sm" onClick={addSocialLink} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Link
            </Button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {socialLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
                <select
                  value={link.icon}
                  onChange={(e) => updateSocialLink(link.id, "icon", e.target.value)}
                  className="px-2 py-1.5 bg-background border border-border rounded-lg text-sm"
                >
                  {availableIcons.map((icon) => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </select>
                <Input
                  value={link.title}
                  onChange={(e) => updateSocialLink(link.id, "title", e.target.value)}
                  placeholder="Title"
                  className="flex-1"
                />
                <Input
                  value={link.url}
                  onChange={(e) => updateSocialLink(link.id, "url", e.target.value)}
                  placeholder="URL"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSocialLink(link.id)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {socialLinks.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No social links added</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Reset Theme Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Theme to Default?</DialogTitle>
            <DialogDescription>
              This will reset all theme colors to their default values. This action cannot be undone until you save.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={resetThemeToDefault}>Reset Theme</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}