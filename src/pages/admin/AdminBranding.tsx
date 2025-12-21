import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Upload, Loader2, Type, Globe, Palette, RotateCcw, Plus, Trash2, Link, 
  Eye, Sparkles, Image, Monitor, Smartphone, Copy, Check, 
  Layers, PaintBucket, Wand2, Code, Mail, LogIn, FileCode, Shield,
  Settings2, Zap, RefreshCw, ChevronRight, Sun, Moon, Brush, Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import { useWhiteLabelSettings } from "@/hooks/useWhiteLabelSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ===== INTERFACES =====
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

interface WhiteLabelConfig {
  custom_css: string;
  custom_head_scripts: string;
  custom_body_scripts: string;
  login_background_url: string;
  login_logo_url: string;
  login_welcome_text: string;
  login_subtitle: string;
  email_header_logo_url: string;
  email_footer_text: string;
  email_primary_color: string;
  powered_by_visible: boolean;
  powered_by_text: string;
  custom_loading_animation: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
}

interface SocialLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  customIcon?: string;
}

// ===== DEFAULTS =====
const defaultBranding: BrandingSettings = {
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

const defaultWhiteLabel: WhiteLabelConfig = {
  custom_css: "",
  custom_head_scripts: "",
  custom_body_scripts: "",
  login_background_url: "",
  login_logo_url: "",
  login_welcome_text: "Welcome Back",
  login_subtitle: "Sign in to continue to your account",
  email_header_logo_url: "",
  email_footer_text: "© 2024 Your Company. All rights reserved.",
  email_primary_color: "#7c3aed",
  powered_by_visible: false,
  powered_by_text: "",
  custom_loading_animation: false,
  maintenance_mode: false,
  maintenance_message: "We're currently performing maintenance. Please check back soon.",
};

const presetThemes = [
  { name: "Purple Glow", primary: "262 83% 58%", accent: "280 100% 70%", bg: "240 10% 4%", card: "240 10% 6%" },
  { name: "Ocean Blue", primary: "210 100% 50%", accent: "190 100% 50%", bg: "215 20% 5%", card: "215 20% 8%" },
  { name: "Emerald", primary: "160 84% 39%", accent: "140 70% 50%", bg: "150 10% 4%", card: "150 10% 7%" },
  { name: "Sunset", primary: "25 95% 53%", accent: "340 82% 52%", bg: "20 15% 5%", card: "20 15% 8%" },
  { name: "Midnight", primary: "240 60% 60%", accent: "200 80% 60%", bg: "230 30% 3%", card: "230 30% 6%" },
  { name: "Rose Gold", primary: "350 80% 65%", accent: "20 80% 70%", bg: "350 10% 5%", card: "350 10% 8%" },
  { name: "Cyber Neon", primary: "170 100% 50%", accent: "320 100% 60%", bg: "220 25% 4%", card: "220 25% 7%" },
  { name: "Warm Earth", primary: "30 60% 50%", accent: "15 70% 55%", bg: "30 15% 5%", card: "30 15% 8%" },
];

const availableFonts = [
  { value: "Space Grotesk", label: "Space Grotesk", category: "Modern" },
  { value: "Outfit", label: "Outfit", category: "Modern" },
  { value: "Inter", label: "Inter", category: "Clean" },
  { value: "Poppins", label: "Poppins", category: "Modern" },
  { value: "Montserrat", label: "Montserrat", category: "Modern" },
  { value: "Playfair Display", label: "Playfair Display", category: "Elegant" },
  { value: "Raleway", label: "Raleway", category: "Clean" },
  { value: "Nunito", label: "Nunito", category: "Friendly" },
  { value: "Oswald", label: "Oswald", category: "Bold" },
  { value: "Bebas Neue", label: "Bebas Neue", category: "Bold" },
  { value: "DM Sans", label: "DM Sans", category: "Modern" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "Modern" },
  { value: "Sora", label: "Sora", category: "Modern" },
  { value: "Manrope", label: "Manrope", category: "Clean" },
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
  { value: "mail", label: "Email" },
  { value: "globe", label: "Website" },
  { value: "custom", label: "Custom" },
];

// ===== COMPONENT =====
export default function AdminBranding() {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig>(defaultWhiteLabel);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("brand");
  
  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  
  // UI states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { refetch: refetchWhiteLabel } = useWhiteLabelSettings();

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedBranding: BrandingSettings = { ...defaultBranding };
      const loadedWhiteLabel: WhiteLabelConfig = { ...defaultWhiteLabel };
      let loadedSocialLinks: SocialLink[] = [];

      data?.forEach((row) => {
        // Handle social links
        if (row.key === "footer_social_links" && row.value) {
          loadedSocialLinks = Array.isArray(row.value) ? (row.value as unknown as SocialLink[]) : [];
          return;
        }
        
        // Handle white-label settings
        if (row.key.startsWith("whitelabel_")) {
          const key = row.key.replace("whitelabel_", "") as keyof WhiteLabelConfig;
          if (key in loadedWhiteLabel) {
            const value = row.value;
            if (typeof defaultWhiteLabel[key] === "boolean") {
              (loadedWhiteLabel as any)[key] = value === true || value === "true" || value === 1;
            } else {
              (loadedWhiteLabel as any)[key] = value ?? defaultWhiteLabel[key];
            }
          }
          return;
        }
        
        // Handle branding settings
        const key = row.key as keyof BrandingSettings;
        if (key in loadedBranding) {
          (loadedBranding as Record<string, any>)[key] = row.value ?? defaultBranding[key];
        }
      });

      setBranding(loadedBranding);
      setWhiteLabel(loadedWhiteLabel);
      setSocialLinks(loadedSocialLinks.length > 0 ? loadedSocialLinks : [
        { id: "1", title: "Twitter", url: "#", icon: "twitter" },
        { id: "2", title: "YouTube", url: "#", icon: "youtube" },
        { id: "3", title: "Discord", url: "#", icon: "discord" },
      ]);

      if (loadedBranding.logo_url) setLogoPreview(loadedBranding.logo_url);
      if (loadedBranding.favicon_url) setFaviconPreview(loadedBranding.favicon_url);
      if (loadedBranding.og_image) setOgImagePreview(loadedBranding.og_image);

      applyThemeColors(loadedBranding);
      if (loadedWhiteLabel.custom_css) applyCustomCSS(loadedWhiteLabel.custom_css);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== THEME FUNCTIONS =====
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

  const applyCustomCSS = (css: string) => {
    let styleElement = document.getElementById("custom-whitelabel-css");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "custom-whitelabel-css";
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
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
    setBranding({ ...branding, [key]: hslString });
    setHasUnsavedChanges(true);

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

  const applyPresetTheme = (preset: typeof presetThemes[0]) => {
    const newBranding = {
      ...branding,
      theme_primary: preset.primary,
      theme_accent: preset.accent,
      theme_background: preset.bg,
      theme_card: preset.card,
    };
    setBranding(newBranding);
    applyThemeColors(newBranding);
    setHasUnsavedChanges(true);
    toast({ title: `Applied "${preset.name}" theme` });
  };

  const resetThemeToDefault = () => {
    const defaultTheme = {
      theme_primary: "262 83% 58%",
      theme_background: "240 10% 4%",
      theme_card: "240 10% 6%",
      theme_accent: "280 100% 70%",
    };
    const newBranding = { ...branding, ...defaultTheme };
    setBranding(newBranding);
    applyThemeColors(newBranding);
    setShowResetDialog(false);
    setHasUnsavedChanges(true);
    toast({ title: "Theme reset to default" });
  };

  // ===== FILE HANDLERS =====
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
      setHasUnsavedChanges(true);
    }
  };

  // ===== SOCIAL LINKS =====
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { id: Date.now().toString(), title: "", url: "", icon: "globe" }]);
    setHasUnsavedChanges(true);
  };

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter((link) => link.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string) => {
    setSocialLinks(socialLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link)));
    setHasUnsavedChanges(true);
  };

  // ===== CLIPBOARD =====
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ===== SAVE ALL SETTINGS =====
  const saveAllSettings = async () => {
    if (!isAdmin) {
      toast({ title: "Only admins can change settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      let logoUrl = branding.logo_url;
      let faviconUrl = branding.favicon_url;
      let ogImageUrl = branding.og_image;

      // Upload files
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

      // Save branding settings
      const brandingToSave = { ...branding, logo_url: logoUrl, favicon_url: faviconUrl, og_image: ogImageUrl };
      for (const [key, value] of Object.entries(brandingToSave)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      // Save social links
      await supabase.from("site_settings").upsert({ key: "footer_social_links", value: socialLinks as any }, { onConflict: "key" });

      // Save white-label settings via edge function
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const accessToken = sessionData?.session?.access_token;
      if (accessToken) {
        const { data, error } = await supabase.functions.invoke("whitelabel-save", {
          body: { config: whiteLabel },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || "Failed to save white-label settings");
      }

      // Apply changes
      applyThemeColors(brandingToSave);
      applyCustomCSS(whiteLabel.custom_css);
      await Promise.resolve(refetchWhiteLabel());
      
      document.title = brandingToSave.site_title;
      setHasUnsavedChanges(false);
      setLogoFile(null);
      setFaviconFile(null);
      setOgImageFile(null);
      
      toast({ title: "All settings saved successfully" });
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // ===== RENDER =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sections = [
    { id: "brand", label: "Brand Identity", icon: Sparkles },
    { id: "theme", label: "Theme & Colors", icon: Palette },
    { id: "typography", label: "Typography", icon: Type },
    { id: "login", label: "Login Page", icon: LogIn },
    { id: "seo", label: "SEO & Meta", icon: Globe },
    { id: "social", label: "Social Links", icon: Link },
    { id: "code", label: "Custom Code", icon: Code },
    { id: "advanced", label: "Advanced", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <AdminSettingsNav />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Brush className="w-6 h-6 text-primary" />
            </div>
            Branding & Customization
          </h2>
          <p className="text-muted-foreground mt-1">Complete control over your platform's appearance and identity</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="border-amber-500 text-amber-500">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="glow" onClick={saveAllSettings} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Side Navigation */}
        <div className="lg:w-64 shrink-0">
          <div className="sticky top-4 space-y-1 p-2 rounded-2xl bg-card/50 border border-border">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* Brand Identity Section */}
            {activeSection === "brand" && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Site Identity */}
                  <div className="glass rounded-2xl p-6 border border-border/50">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Type className="w-5 h-5 text-primary" />
                      Site Identity
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Site Name</Label>
                        <Input 
                          value={branding.site_name} 
                          onChange={(e) => { setBranding({ ...branding, site_name: e.target.value }); setHasUnsavedChanges(true); }} 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Tagline</Label>
                        <Input 
                          value={branding.site_tagline} 
                          onChange={(e) => { setBranding({ ...branding, site_tagline: e.target.value }); setHasUnsavedChanges(true); }} 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Browser Tab Title</Label>
                        <Input 
                          value={branding.site_title} 
                          onChange={(e) => { setBranding({ ...branding, site_title: e.target.value }); setHasUnsavedChanges(true); }} 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Footer Copyright</Label>
                        <Input 
                          value={branding.footer_copyright} 
                          onChange={(e) => { setBranding({ ...branding, footer_copyright: e.target.value }); setHasUnsavedChanges(true); }} 
                          placeholder="© 2024 Company. All rights reserved." 
                          className="mt-1" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brand Assets */}
                  <div className="glass rounded-2xl p-6 border border-border/50">
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
                              <Button variant="ghost" size="sm" onClick={() => { setLogoPreview(null); setLogoFile(null); setBranding({ ...branding, logo_url: null }); setHasUnsavedChanges(true); }} className="text-destructive">
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
                  </div>
                </div>
              </motion.div>
            )}

            {/* Theme & Colors Section */}
            {activeSection === "theme" && (
              <motion.div
                key="theme"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Theme Presets */}
                <div className="glass rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-primary" />
                      Theme Presets
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Reset to Default
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {presetThemes.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPresetTheme(preset)}
                        className="p-3 rounded-xl border border-border hover:border-primary transition-all group"
                      >
                        <div className="flex gap-1 mb-2 justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-background" style={{ backgroundColor: `hsl(${preset.primary})` }} />
                          <div className="w-5 h-5 rounded-full border-2 border-background -ml-2" style={{ backgroundColor: `hsl(${preset.accent})` }} />
                        </div>
                        <p className="text-xs font-medium group-hover:text-primary transition-colors text-center">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="glass rounded-2xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <PaintBucket className="w-5 h-5 text-primary" />
                    Custom Colors
                  </h3>
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
                            value={hslToHex(branding[color.key as keyof BrandingSettings] as string)}
                            onChange={(e) => handleColorChange(color.key as keyof BrandingSettings, e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                          />
                          <div className="flex-1 space-y-1">
                            <Input
                              value={hslToHex(branding[color.key as keyof BrandingSettings] as string)}
                              onChange={(e) => handleColorChange(color.key as keyof BrandingSettings, e.target.value)}
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">{color.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="glass rounded-2xl p-6 border border-border/50">
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
                  <div className={`p-4 rounded-xl border border-border ${previewMode === "mobile" ? "max-w-xs mx-auto" : ""}`} style={{ backgroundColor: `hsl(${branding.theme_background})` }}>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: `hsl(${branding.theme_card})` }}>
                      <h4 className="font-bold text-lg mb-2" style={{ fontFamily: `"${branding.font_heading}", sans-serif` }}>
                        Sample Heading
                      </h4>
                      <p className="text-sm opacity-70 mb-4" style={{ fontFamily: `"${branding.font_body}", sans-serif` }}>
                        This is how your content will look with the selected colors and fonts.
                      </p>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: `hsl(${branding.theme_primary})`, color: "white" }}>
                          Primary
                        </button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: `hsl(${branding.theme_accent})`, color: "white" }}>
                          Accent
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Typography Section */}
            {activeSection === "typography" && (
              <motion.div
                key="typography"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="glass rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Type className="w-5 h-5 text-primary" />
                      Typography
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setBranding({ ...branding, font_heading: "Space Grotesk", font_body: "Outfit" });
                        loadGoogleFont("Space Grotesk");
                        loadGoogleFont("Outfit");
                        document.documentElement.style.setProperty("--font-heading", `"Space Grotesk", sans-serif`);
                        document.documentElement.style.setProperty("--font-body", `"Outfit", sans-serif`);
                        setHasUnsavedChanges(true);
                        toast({ title: "Fonts reset to default" });
                      }} 
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-3 block">Heading Font</Label>
                      <ScrollArea className="h-64 rounded-xl border border-border p-2">
                        <div className="grid grid-cols-2 gap-2">
                          {availableFonts.map((font) => (
                            <button
                              key={font.value}
                              onClick={() => {
                                setBranding({ ...branding, font_heading: font.value });
                                loadGoogleFont(font.value);
                                document.documentElement.style.setProperty("--font-heading", `"${font.value}", sans-serif`);
                                setHasUnsavedChanges(true);
                              }}
                              className={`p-3 rounded-lg border text-left transition-all ${branding.font_heading === font.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                            >
                              <p className="font-medium text-sm" style={{ fontFamily: `"${font.value}", sans-serif` }}>{font.label}</p>
                              <p className="text-xs text-muted-foreground">{font.category}</p>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <div>
                      <Label className="mb-3 block">Body Font</Label>
                      <ScrollArea className="h-64 rounded-xl border border-border p-2">
                        <div className="grid grid-cols-2 gap-2">
                          {availableFonts.map((font) => (
                            <button
                              key={font.value}
                              onClick={() => {
                                setBranding({ ...branding, font_body: font.value });
                                loadGoogleFont(font.value);
                                document.documentElement.style.setProperty("--font-body", `"${font.value}", sans-serif`);
                                setHasUnsavedChanges(true);
                              }}
                              className={`p-3 rounded-lg border text-left transition-all ${branding.font_body === font.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                            >
                              <p className="font-medium text-sm" style={{ fontFamily: `"${font.value}", sans-serif` }}>{font.label}</p>
                              <p className="text-xs text-muted-foreground">{font.category}</p>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
                    <p style={{ fontFamily: `"${branding.font_heading}", sans-serif`, fontWeight: 600, fontSize: "1.25rem" }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                    <p className="mt-2" style={{ fontFamily: `"${branding.font_body}", sans-serif` }}>
                      The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Login Page Section */}
            {activeSection === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="glass rounded-2xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-primary" />
                    Login Page Branding
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Background Image URL</Label>
                        <Input
                          value={whiteLabel.login_background_url}
                          onChange={(e) => { setWhiteLabel({ ...whiteLabel, login_background_url: e.target.value }); setHasUnsavedChanges(true); }}
                          placeholder="https://example.com/background.jpg"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Login Logo URL</Label>
                        <Input
                          value={whiteLabel.login_logo_url}
                          onChange={(e) => { setWhiteLabel({ ...whiteLabel, login_logo_url: e.target.value }); setHasUnsavedChanges(true); }}
                          placeholder="https://example.com/logo.png"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Welcome Text</Label>
                        <Input
                          value={whiteLabel.login_welcome_text}
                          onChange={(e) => { setWhiteLabel({ ...whiteLabel, login_welcome_text: e.target.value }); setHasUnsavedChanges(true); }}
                          placeholder="Welcome Back"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={whiteLabel.login_subtitle}
                          onChange={(e) => { setWhiteLabel({ ...whiteLabel, login_subtitle: e.target.value }); setHasUnsavedChanges(true); }}
                          placeholder="Sign in to continue"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-border h-72">
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ 
                          backgroundImage: whiteLabel.login_background_url 
                            ? `url(${whiteLabel.login_background_url})` 
                            : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)" 
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          {whiteLabel.login_logo_url && (
                            <img src={whiteLabel.login_logo_url} alt="Logo" className="h-12 mx-auto mb-4" />
                          )}
                          <h3 className="text-xl font-bold">{whiteLabel.login_welcome_text || "Welcome Back"}</h3>
                          <p className="text-sm opacity-80">{whiteLabel.login_subtitle || "Sign in to continue"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Branding */}
                <div className="glass rounded-2xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Email Branding
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Email Header Logo URL</Label>
                        <Input
                          value={whiteLabel.email_header_logo_url}
                          onChange={(e) => { setWhiteLabel({ ...whiteLabel, email_header_logo_url: e.target.value }); setHasUnsavedChanges(true); }}
                          placeholder="https://example.com/email-logo.png"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Primary Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={whiteLabel.email_primary_color}
                            onChange={(e) => { setWhiteLabel({ ...whiteLabel, email_primary_color: e.target.value }); setHasUnsavedChanges(true); }}
                            className="w-12 h-10 rounded cursor-pointer border border-border"
                          />
                          <Input
                            value={whiteLabel.email_primary_color}
                            onChange={(e) => { setWhiteLabel({ ...whiteLabel, email_primary_color: e.target.value }); setHasUnsavedChanges(true); }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Footer Text</Label>
                        <Textarea
                          value={whiteLabel.email_footer_text}
                          onChange={(e) => { setWhiteLabel({ ...whiteLabel, email_footer_text: e.target.value }); setHasUnsavedChanges(true); }}
                          placeholder="© 2024 Your Company. All rights reserved."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-white text-black p-4">
                      <div 
                        className="h-16 rounded-lg flex items-center justify-center mb-4"
                        style={{ backgroundColor: whiteLabel.email_primary_color }}
                      >
                        {whiteLabel.email_header_logo_url ? (
                          <img src={whiteLabel.email_header_logo_url} alt="Logo" className="h-8" />
                        ) : (
                          <span className="text-white font-bold">Your Logo</span>
                        )}
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-5/6" />
                      </div>
                      <div 
                        className="px-4 py-2 rounded text-white text-center text-sm font-medium"
                        style={{ backgroundColor: whiteLabel.email_primary_color }}
                      >
                        Call to Action
                      </div>
                      <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
                        {whiteLabel.email_footer_text || "© 2024 Your Company"}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SEO Section */}
            {activeSection === "seo" && (
              <motion.div
                key="seo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-6 border border-border/50"
              >
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  SEO & Meta Tags
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={branding.meta_description}
                      onChange={(e) => { setBranding({ ...branding, meta_description: e.target.value }); setHasUnsavedChanges(true); }}
                      placeholder="A brief description of your site for search engines..."
                      rows={3}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{branding.meta_description.length}/160 characters recommended</p>
                  </div>
                  <div>
                    <Label>Meta Keywords</Label>
                    <Input 
                      value={branding.meta_keywords} 
                      onChange={(e) => { setBranding({ ...branding, meta_keywords: e.target.value }); setHasUnsavedChanges(true); }} 
                      placeholder="casino, streaming, slots, gambling..." 
                      className="mt-1" 
                    />
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
            )}

            {/* Social Links Section */}
            {activeSection === "social" && (
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-6 border border-border/50"
              >
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
                      className="p-4 rounded-xl bg-secondary/50 border border-border"
                    >
                      <div className="flex flex-wrap items-center gap-3">
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
                          className="flex-1 min-w-[120px]"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) => updateSocialLink(link.id, "url", e.target.value)}
                          placeholder="https://..."
                          className="flex-1 min-w-[180px]"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeSocialLink(link.id)} className="text-destructive hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {link.icon === "custom" && (
                        <div className="flex items-center gap-2 mt-3">
                          <Label className="text-xs whitespace-nowrap">Custom Icon Class:</Label>
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
            )}

            {/* Custom Code Section */}
            {activeSection === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Custom CSS */}
                <div className="glass rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <Code className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Custom CSS</h3>
                      <p className="text-sm text-muted-foreground">Add custom styles to override default theme</p>
                    </div>
                  </div>
                  <Textarea
                    value={whiteLabel.custom_css}
                    onChange={(e) => { setWhiteLabel({ ...whiteLabel, custom_css: e.target.value }); setHasUnsavedChanges(true); }}
                    placeholder={`/* Custom CSS */\n.my-custom-class {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n}`}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <div className="flex items-center gap-4 mt-4">
                    <Button variant="outline" size="sm" onClick={() => applyCustomCSS(whiteLabel.custom_css)} className="gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(whiteLabel.custom_css, "css")} className="gap-2">
                      {copiedField === "css" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Custom Scripts */}
                <div className="glass rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <FileCode className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Custom Scripts</h3>
                      <p className="text-sm text-muted-foreground">Add tracking codes, analytics, or custom JavaScript</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Head Scripts (loaded before page content)</Label>
                      <Textarea
                        value={whiteLabel.custom_head_scripts}
                        onChange={(e) => { setWhiteLabel({ ...whiteLabel, custom_head_scripts: e.target.value }); setHasUnsavedChanges(true); }}
                        placeholder={`<!-- Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>`}
                        rows={6}
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label>Body Scripts (loaded after page content)</Label>
                      <Textarea
                        value={whiteLabel.custom_body_scripts}
                        onChange={(e) => { setWhiteLabel({ ...whiteLabel, custom_body_scripts: e.target.value }); setHasUnsavedChanges(true); }}
                        placeholder={`<!-- Chat widget, etc. -->\n<script>\n  // Your custom script\n</script>`}
                        rows={6}
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>Security Note:</strong> Only add scripts from trusted sources.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Advanced Section */}
            {activeSection === "advanced" && (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-6 border border-border/50"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Shield className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Advanced Settings</h3>
                    <p className="text-sm text-muted-foreground">System-level configuration options</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                    <div>
                      <p className="font-medium">Show "Powered By" Badge</p>
                      <p className="text-sm text-muted-foreground">Display attribution in footer</p>
                    </div>
                    <Switch
                      checked={whiteLabel.powered_by_visible}
                      onCheckedChange={(checked) => { setWhiteLabel({ ...whiteLabel, powered_by_visible: checked }); setHasUnsavedChanges(true); }}
                    />
                  </div>

                  {whiteLabel.powered_by_visible && (
                    <div className="pl-4">
                      <Label>Powered By Text</Label>
                      <Input
                        value={whiteLabel.powered_by_text}
                        onChange={(e) => { setWhiteLabel({ ...whiteLabel, powered_by_text: e.target.value }); setHasUnsavedChanges(true); }}
                        placeholder="Powered by Your Platform"
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                    <div>
                      <p className="font-medium">Custom Loading Animation</p>
                      <p className="text-sm text-muted-foreground">Use branded loading spinner</p>
                    </div>
                    <Switch
                      checked={whiteLabel.custom_loading_animation}
                      onCheckedChange={(checked) => { setWhiteLabel({ ...whiteLabel, custom_loading_animation: checked }); setHasUnsavedChanges(true); }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div>
                      <p className="font-medium text-red-500">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Show maintenance page to visitors</p>
                    </div>
                    <Switch
                      checked={whiteLabel.maintenance_mode}
                      onCheckedChange={(checked) => { setWhiteLabel({ ...whiteLabel, maintenance_mode: checked }); setHasUnsavedChanges(true); }}
                    />
                  </div>

                  {whiteLabel.maintenance_mode && (
                    <div className="pl-4">
                      <Label>Maintenance Message</Label>
                      <Textarea
                        value={whiteLabel.maintenance_message}
                        onChange={(e) => { setWhiteLabel({ ...whiteLabel, maintenance_message: e.target.value }); setHasUnsavedChanges(true); }}
                        placeholder="We're currently performing maintenance..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Theme to Default?</DialogTitle>
            <DialogDescription>
              This will reset all theme colors to their default values. Save to apply.
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
