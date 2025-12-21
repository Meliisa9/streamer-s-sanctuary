import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Palette, Code, Mail, LogIn, Save, Loader2, Eye, Copy, Check,
  RefreshCw, Wand2, FileCode, Layout, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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

const defaultConfig: WhiteLabelConfig = {
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

export function WhiteLabelSettings() {
  const [config, setConfig] = useState<WhiteLabelConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .like("key", "whitelabel_%");

      if (error) throw error;

      const loadedConfig = { ...defaultConfig };
      data?.forEach((row) => {
        const key = row.key.replace("whitelabel_", "") as keyof WhiteLabelConfig;
        if (key in loadedConfig) {
          const value = row.value;
          // Handle boolean values properly
          if (typeof defaultConfig[key] === "boolean") {
            (loadedConfig as any)[key] = value === true || value === "true" || value === 1;
          } else {
            (loadedConfig as any)[key] = value ?? defaultConfig[key];
          }
        }
      });

      setConfig(loadedConfig);
      
      // Apply settings on load
      if (loadedConfig.custom_css) {
        applyCustomCSS(loadedConfig.custom_css);
      }
    } catch (error) {
      console.error("Error fetching white-label config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!isAdmin) {
      toast({ title: "Admin access required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("whitelabel-save", {
        body: { config },
      });

      if (error) {
        throw error;
      }

      if (!data?.ok) {
        throw new Error(data?.error || "Failed to save settings");
      }

      // Apply immediately for instant feedback
      applyCustomCSS(config.custom_css);
      if (config.custom_head_scripts) applyHeadScripts(config.custom_head_scripts);
      if (config.custom_body_scripts) applyBodyScripts(config.custom_body_scripts);

      toast({ title: "White-label settings saved successfully" });
    } catch (error: any) {
      console.error("Error saving white-label settings:", error);
      toast({
        title: "Error saving settings",
        description: error?.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  const applyHeadScripts = (scripts: string) => {
    if (!scripts) return;
    let container = document.getElementById("custom-head-scripts");
    if (!container) {
      container = document.createElement("div");
      container.id = "custom-head-scripts";
      document.head.appendChild(container);
    }
    container.innerHTML = scripts;
  };

  const applyBodyScripts = (scripts: string) => {
    if (!scripts) return;
    let container = document.getElementById("custom-body-scripts");
    if (!container) {
      container = document.createElement("div");
      container.id = "custom-body-scripts";
      document.body.appendChild(container);
    }
    container.innerHTML = scripts;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
          <h2 className="text-2xl font-bold">White-Label Configuration</h2>
          <p className="text-muted-foreground">Complete branding customization for your platform</p>
        </div>
        <Button variant="glow" onClick={saveConfig} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="css" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="css" className="gap-2">
            <Code className="w-4 h-4" />
            Custom CSS
          </TabsTrigger>
          <TabsTrigger value="login" className="gap-2">
            <LogIn className="w-4 h-4" />
            Login Page
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="scripts" className="gap-2">
            <FileCode className="w-4 h-4" />
            Scripts
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Shield className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Custom CSS Tab */}
        <TabsContent value="css" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Code className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Custom CSS</h3>
                <p className="text-sm text-muted-foreground">Add custom styles to override default theme</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>CSS Code</Label>
                <Textarea
                  value={config.custom_css}
                  onChange={(e) => setConfig({ ...config, custom_css: e.target.value })}
                  placeholder={`/* Custom CSS */
.my-custom-class {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Override primary button */
.btn-primary {
  border-radius: 9999px;
}`}
                  rows={15}
                  className="font-mono text-sm mt-2"
                />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyCustomCSS(config.custom_css)}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(config.custom_css, "css")}
                  className="gap-2"
                >
                  {copiedField === "css" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm font-medium mb-2">CSS Variables Reference</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
                  <span>--primary</span>
                  <span>--background</span>
                  <span>--foreground</span>
                  <span>--card</span>
                  <span>--accent</span>
                  <span>--muted</span>
                  <span>--border</span>
                  <span>--destructive</span>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Login Page Tab */}
        <TabsContent value="login" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <LogIn className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Login Page Branding</h3>
                <p className="text-sm text-muted-foreground">Customize the authentication page appearance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Background Image URL</Label>
                  <Input
                    value={config.login_background_url}
                    onChange={(e) => setConfig({ ...config, login_background_url: e.target.value })}
                    placeholder="https://example.com/background.jpg"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Login Logo URL</Label>
                  <Input
                    value={config.login_logo_url}
                    onChange={(e) => setConfig({ ...config, login_logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Welcome Text</Label>
                  <Input
                    value={config.login_welcome_text}
                    onChange={(e) => setConfig({ ...config, login_welcome_text: e.target.value })}
                    placeholder="Welcome Back"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={config.login_subtitle}
                    onChange={(e) => setConfig({ ...config, login_subtitle: e.target.value })}
                    placeholder="Sign in to continue"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden border border-border h-64">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: config.login_background_url 
                      ? `url(${config.login_background_url})` 
                      : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)" 
                  }}
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    {config.login_logo_url && (
                      <img src={config.login_logo_url} alt="Logo" className="h-12 mx-auto mb-4" />
                    )}
                    <h3 className="text-xl font-bold">{config.login_welcome_text || "Welcome Back"}</h3>
                    <p className="text-sm opacity-80">{config.login_subtitle || "Sign in to continue"}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <Mail className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Email Branding</h3>
                <p className="text-sm text-muted-foreground">Customize email notifications appearance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Email Header Logo URL</Label>
                  <Input
                    value={config.email_header_logo_url}
                    onChange={(e) => setConfig({ ...config, email_header_logo_url: e.target.value })}
                    placeholder="https://example.com/email-logo.png"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.email_primary_color}
                      onChange={(e) => setConfig({ ...config, email_primary_color: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={config.email_primary_color}
                      onChange={(e) => setConfig({ ...config, email_primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Footer Text</Label>
                  <Textarea
                    value={config.email_footer_text}
                    onChange={(e) => setConfig({ ...config, email_footer_text: e.target.value })}
                    placeholder="© 2024 Your Company. All rights reserved."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Email Preview */}
              <div className="rounded-xl border border-border bg-white text-black p-4">
                <div 
                  className="h-16 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: config.email_primary_color }}
                >
                  {config.email_header_logo_url ? (
                    <img src={config.email_header_logo_url} alt="Logo" className="h-8" />
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
                  style={{ backgroundColor: config.email_primary_color }}
                >
                  Call to Action
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
                  {config.email_footer_text || "© 2024 Your Company"}
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Scripts Tab */}
        <TabsContent value="scripts" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <FileCode className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Custom Scripts</h3>
                <p className="text-sm text-muted-foreground">Add tracking codes, analytics, or custom JavaScript</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Head Scripts (loaded before page content)</Label>
                <Textarea
                  value={config.custom_head_scripts}
                  onChange={(e) => setConfig({ ...config, custom_head_scripts: e.target.value })}
                  placeholder={`<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>`}
                  rows={8}
                  className="font-mono text-sm mt-2"
                />
              </div>

              <div>
                <Label>Body Scripts (loaded after page content)</Label>
                <Textarea
                  value={config.custom_body_scripts}
                  onChange={(e) => setConfig({ ...config, custom_body_scripts: e.target.value })}
                  placeholder={`<!-- Chat widget, etc. -->
<script>
  // Your custom script here
</script>`}
                  rows={8}
                  className="font-mono text-sm mt-2"
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <strong>Security Note:</strong> Only add scripts from trusted sources. 
                  Malicious scripts can compromise user security and privacy.
                </p>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Advanced Settings</h3>
                <p className="text-sm text-muted-foreground">System-level configuration options</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <p className="font-medium">Show "Powered By" Badge</p>
                  <p className="text-sm text-muted-foreground">Display attribution in footer</p>
                </div>
                <Switch
                  checked={config.powered_by_visible}
                  onCheckedChange={(checked) => setConfig({ ...config, powered_by_visible: checked })}
                />
              </div>

              {config.powered_by_visible && (
                <div>
                  <Label>Powered By Text</Label>
                  <Input
                    value={config.powered_by_text}
                    onChange={(e) => setConfig({ ...config, powered_by_text: e.target.value })}
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
                  checked={config.custom_loading_animation}
                  onCheckedChange={(checked) => setConfig({ ...config, custom_loading_animation: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div>
                  <p className="font-medium text-red-500">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Show maintenance page to visitors</p>
                </div>
                <Switch
                  checked={config.maintenance_mode}
                  onCheckedChange={(checked) => setConfig({ ...config, maintenance_mode: checked })}
                />
              </div>

              {config.maintenance_mode && (
                <div>
                  <Label>Maintenance Message</Label>
                  <Textarea
                    value={config.maintenance_message}
                    onChange={(e) => setConfig({ ...config, maintenance_message: e.target.value })}
                    placeholder="We're currently performing maintenance..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
