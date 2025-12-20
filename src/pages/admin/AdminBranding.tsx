import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Save, Upload, Loader2, Type, Globe, Palette, RotateCcw, Plus, Trash2, Link, 
  Eye, Sparkles, Image, Monitor, Smartphone, Sun, Moon, Copy, Check, 
  Download, RefreshCw, Layers, PaintBucket, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
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
  font_heading: string;
  font_body: string;
  meta_description: string;
  meta_keywords: string;
  og_image: string | null;
}

interface SocialLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  customIcon?: string;
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
  font_heading: "Space Grotesk",
  font_body: "Outfit",
  meta_description: "",
  meta_keywords: "",
  og_image: null,
};

const defaultTheme = {
  theme_primary: "262 83% 58%",
  theme_background: "240 10% 4%",
  theme_card: "240 10% 6%",
  theme_accent: "280 100% 70%",
};

const presetThemes = [
  { name: "Purple Glow", primary: "262 83% 58%", accent: "280 100% 70%", bg: "240 10% 4%", card: "240 10% 6%" },
  { name: "Ocean Blue", primary: "210 100% 50%", accent: "190 100% 50%", bg: "215 20% 5%", card: "215 20% 8%" },
  { name: "Emerald", primary: "160 84% 39%", accent: "140 70% 50%", bg: "150 10% 4%", card: "150 10% 7%" },
  { name: "Sunset", primary: "25 95% 53%", accent: "340 82% 52%", bg: "20 15% 5%", card: "20 15% 8%" },
  { name: "Midnight", primary: "240 60% 60%", accent: "200 80% 60%", bg: "230 30% 3%", card: "230 30% 6%" },
  { name: "Rose Gold", primary: "350 80% 65%", accent: "20 80% 70%", bg: "350 10% 5%", card: "350 10% 8%" },
];

const availableFonts = [
  { value: "Space Grotesk", label: "Space Grotesk", category: "Modern" },
  { value: "Outfit", label: "Outfit", category: "Modern" },
  { value: "Inter", label: "Inter", category: "Clean" },
  { value: "Poppins", label: "Poppins", category: "Modern" },
  { value: "Roboto", label: "Roboto", category: "Clean" },
  { value: "Montserrat", label: "Montserrat", category: "Modern" },
  { value: "Playfair Display", label: "Playfair Display", category: "Elegant" },
  { value: "Raleway", label: "Raleway", category: "Clean" },
  { value: "Nunito", label: "Nunito", category: "Friendly" },
  { value: "Ubuntu", label: "Ubuntu", category: "Tech" },
  { value: "Oswald", label: "Oswald", category: "Bold" },
  { value: "Bebas Neue", label: "Bebas Neue", category: "Bold" },
  { value: "DM Sans", label: "DM Sans", category: "Modern" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "Modern" },
];

const availableIcons = [
  { value: "twitter", label: "Twitter/X" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "discord", label: "Discord" },
  { value: "twitch", label: "Twitch" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "kick", label: "Kick" },
  { value: "telegram", label: "Telegram" },
  { value: "reddit", label: "Reddit" },
  { value: "patreon", label: "Patreon" },
  { value: "mail", label: "Email" },
  { value: "globe", label: "Website" },
  { value: "custom", label: "Custom (FontAwesome)" },
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
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
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
      if (loadedSettings.og_image) setOgImagePreview(loadedSettings.og_image);

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

    if (themeSettings.font_heading) {
      loadGoogleFont(themeSettings.font_heading);
      root.style.setProperty("--font-heading", `"${themeSettings.font_heading}", sans-serif`);
    }
    if (themeSettings.font_body) {
      loadGoogleFont(themeSettings.font_body);
      root.style.setProperty("--font-body", `"${themeSettings.font_body}", sans-serif`);
    }
  };

  const loadGoogleFont = (fontName: string) => {
    const existingLink = document.querySelector(`link[data-font="${fontName}"]`);
    if (existingLink) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;
    link.setAttribute("data-font", fontName);
    document.head.appendChild(link);
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
    setSocialLinks(socialLinks.filter((link) => link.id !== id));
  };

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string) => {
    setSocialLinks(socialLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link)));
  };

  const applyPresetTheme = (preset: typeof presetThemes[0]) => {
    setSettings({
      ...settings,
      theme_primary: preset.primary,
      theme_accent: preset.accent,
      theme_background: preset.bg,
      theme_card: preset.card,
    });
    applyThemeColors({
      ...settings,
      theme_primary: preset.primary,
      theme_accent: preset.accent,
      theme_background: preset.bg,
      theme_card: preset.card,
    });
    toast({ title: `Applied "${preset.name}" theme` });
  };

  const resetThemeToDefault = () => {
    setSettings({ ...settings, ...defaultTheme });
    applyThemeColors({ ...settings, ...defaultTheme });
    setShowResetDialog(false);
    toast({ title: "Theme reset to default" });
  };

  const copyColor = (colorKey: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(colorKey);
    setTimeout(() => setCopiedColor(null), 2000);
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
      let ogImageUrl = settings.og_image;

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

      if (ogImageFile) {
        const fileExt = ogImageFile.name.split(".").pop();
        const fileName = `og-image-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("media").upload(fileName, ogImageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
        ogImageUrl = publicUrl;
      }

      const settingsToSave = { ...settings, logo_url: logoUrl, favicon_url: faviconUrl, og_image: ogImageUrl };

      for (const [key, value] of Object.entries(settingsToSave)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      await supabase.from("site_settings").upsert({ key: "footer_social_links", value: socialLinks as any }, { onConflict: "key" });

      applyThemeColors(settingsToSave);
      toast({ title: "Branding settings saved" });
      setLogoFile(null);
      setFaviconFile(null);
      setOgImageFile(null);
      document.title = settingsToSave.site_title;
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorChange = (key: keyof BrandingSettings, hexColor: string) => {
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
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
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
          <h2 className="text-2xl font-bold">Branding & Appearance</h2>
          <p className="text-muted-foreground">Customize your site's look and feel</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="identity" className="gap-2">
            <Type className="w-4 h-4" />
            Identity
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="fonts" className="gap-2">
            <Layers className="w-4 h-4" />
            Fonts
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Globe className="w-4 h-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Link className="w-4 h-4" />
            Social
          </TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                Site Identity
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Site Name</Label>
                  <Input value={settings.site_name} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input value={settings.site_tagline} onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Browser Tab Title</Label>
                  <Input value={settings.site_title} onChange={(e) => setSettings({ ...settings, site_title: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Footer Copyright</Label>
                  <Input value={settings.footer_copyright} onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })} placeholder="© 2024 Company. All rights reserved." className="mt-1" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Brand Assets
              </h3>
              <div className="space-y-6">
                <div>
                  <Label>Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-xl object-contain border border-border bg-secondary/50" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center border border-border">
                        <Type className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)} className="hidden" />
                        <Button variant="outline" type="button" asChild size="sm">
                          <span><Upload className="w-4 h-4 mr-2" />Upload</span>
                        </Button>
                      </label>
                      {logoPreview && (
                        <Button variant="ghost" size="sm" onClick={() => { setLogoPreview(null); setLogoFile(null); setSettings({ ...settings, logo_url: null }); }} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-1" />Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Favicon</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {faviconPreview ? (
                      <img src={faviconPreview} alt="Favicon" className="w-12 h-12 rounded object-cover border border-border" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center border border-border">
                        <Globe className="w-5 h-5 text-muted-foreground" />
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
              </div>
            </motion.div>
          </div>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Theme Presets
              </h3>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {presetThemes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPresetTheme(preset)}
                  className="p-3 rounded-xl border border-border hover:border-primary transition-all group"
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${preset.primary})` }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${preset.accent})` }} />
                  </div>
                  <p className="text-xs font-medium group-hover:text-primary transition-colors">{preset.name}</p>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PaintBucket className="w-5 h-5 text-primary" />
                Custom Colors
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { key: "theme_primary", label: "Primary", desc: "Main brand color" },
                { key: "theme_accent", label: "Accent", desc: "Highlights & CTAs" },
                { key: "theme_background", label: "Background", desc: "Page background" },
                { key: "theme_card", label: "Card", desc: "Card surfaces" },
              ].map((color) => (
                <div key={color.key} className="space-y-2">
                  <Label>{color.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={hslToHex(settings[color.key as keyof BrandingSettings] as string)}
                      onChange={(e) => handleColorChange(color.key as keyof BrandingSettings, e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <div className="flex-1 space-y-1">
                      <Input
                        value={hslToHex(settings[color.key as keyof BrandingSettings] as string)}
                        onChange={(e) => handleColorChange(color.key as keyof BrandingSettings, e.target.value)}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">{color.desc}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyColor(color.key, hslToHex(settings[color.key as keyof BrandingSettings] as string))}
                      className="shrink-0"
                    >
                      {copiedColor === color.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Live Preview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Live Preview
              </h3>
              <div className="flex gap-2">
                <Button variant={previewMode === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("desktop")}>
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button variant={previewMode === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("mobile")}>
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className={`p-4 rounded-xl border border-border ${previewMode === "mobile" ? "max-w-xs mx-auto" : ""}`} style={{ backgroundColor: `hsl(${settings.theme_background})` }}>
              <div className="p-4 rounded-lg" style={{ backgroundColor: `hsl(${settings.theme_card})` }}>
                <h4 className="font-bold text-lg mb-2" style={{ fontFamily: `"${settings.font_heading}", sans-serif` }}>
                  Sample Heading
                </h4>
                <p className="text-sm opacity-70 mb-4" style={{ fontFamily: `"${settings.font_body}", sans-serif` }}>
                  This is how your content will look with the selected colors and fonts.
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: `hsl(${settings.theme_primary})`, color: "white" }}>
                    Primary Button
                  </button>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: `hsl(${settings.theme_accent})`, color: "white" }}>
                    Accent Button
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Fonts Tab */}
        <TabsContent value="fonts" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              Typography
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Heading Font</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableFonts.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => {
                        setSettings({ ...settings, font_heading: font.value });
                        loadGoogleFont(font.value);
                        document.documentElement.style.setProperty("--font-heading", `"${font.value}", sans-serif`);
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${settings.font_heading === font.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    >
                      <p className="font-medium text-sm" style={{ fontFamily: `"${font.value}", sans-serif` }}>{font.label}</p>
                      <p className="text-xs text-muted-foreground">{font.category}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Body Font</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableFonts.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => {
                        setSettings({ ...settings, font_body: font.value });
                        loadGoogleFont(font.value);
                        document.documentElement.style.setProperty("--font-body", `"${font.value}", sans-serif`);
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${settings.font_body === font.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    >
                      <p className="font-medium text-sm" style={{ fontFamily: `"${font.value}", sans-serif` }}>{font.label}</p>
                      <p className="text-xs text-muted-foreground">{font.category}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
              <p style={{ fontFamily: `"${settings.font_heading}", sans-serif`, fontWeight: 600, fontSize: "1.25rem" }}>
                The quick brown fox jumps over the lazy dog
              </p>
              <p className="mt-2" style={{ fontFamily: `"${settings.font_body}", sans-serif` }}>
                The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              </p>
            </div>
          </motion.div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              SEO & Meta Tags
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Meta Description</Label>
                <textarea
                  value={settings.meta_description}
                  onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                  placeholder="A brief description of your site for search engines..."
                  rows={3}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{settings.meta_description.length}/160 characters recommended</p>
              </div>
              <div>
                <Label>Meta Keywords</Label>
                <Input value={settings.meta_keywords} onChange={(e) => setSettings({ ...settings, meta_keywords: e.target.value })} placeholder="casino, streaming, slots, gambling..." className="mt-1" />
              </div>
              <div>
                <Label>Open Graph Image</Label>
                <div className="mt-2 flex items-center gap-4">
                  {ogImagePreview ? (
                    <img src={ogImagePreview} alt="OG Image" className="w-40 h-20 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-40 h-20 rounded-lg bg-secondary flex items-center justify-center border border-border text-xs text-muted-foreground">1200x630 px</div>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setOgImageFile, setOgImagePreview)} className="hidden" />
                    <Button variant="outline" type="button" asChild size="sm">
                      <span><Upload className="w-4 h-4 mr-2" />Upload</span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Displayed when shared on social media (1200x630 recommended)</p>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Footer Social Links
              </h3>
              <Button variant="outline" size="sm" onClick={addSocialLink} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Link
              </Button>
            </div>
            <div className="space-y-3">
              {socialLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <select
                      value={link.icon}
                      onChange={(e) => updateSocialLink(link.id, "icon", e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm min-w-[140px]"
                    >
                      {availableIcons.map((icon) => (
                        <option key={icon.value} value={icon.value}>{icon.label}</option>
                      ))}
                    </select>
                    <Input
                      value={link.title}
                      onChange={(e) => updateSocialLink(link.id, "title", e.target.value)}
                      placeholder="Display Name"
                      className="flex-1"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateSocialLink(link.id, "url", e.target.value)}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeSocialLink(link.id)} className="text-destructive hover:text-destructive shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {link.icon === "custom" && (
                    <div className="flex items-center gap-2 pl-2">
                      <Label className="text-xs whitespace-nowrap">FontAwesome Class:</Label>
                      <Input
                        value={link.customIcon || ""}
                        onChange={(e) => updateSocialLink(link.id, "customIcon", e.target.value)}
                        placeholder="e.g., fa-brands fa-tiktok"
                        className="flex-1 text-sm"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
              {socialLinks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No social links added. Click "Add Link" to get started.
                </p>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

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
