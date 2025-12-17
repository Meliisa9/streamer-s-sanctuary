import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, FileText, Shield, Cookie, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface LegalSettings {
  legal_privacy_policy: string;
  legal_terms_of_service: string;
  legal_cookie_policy: string;
  legal_responsible_gambling: string;
}

const defaultSettings: LegalSettings = {
  legal_privacy_policy: "",
  legal_terms_of_service: "",
  legal_cookie_policy: "",
  legal_responsible_gambling: "",
};

const legalPages = [
  { key: "legal_privacy_policy", label: "Privacy Policy", icon: Shield },
  { key: "legal_terms_of_service", label: "Terms of Service", icon: FileText },
  { key: "legal_cookie_policy", label: "Cookie Policy", icon: Cookie },
  { key: "legal_responsible_gambling", label: "Responsible Gambling", icon: AlertTriangle },
];

export default function AdminLegal() {
  const [settings, setSettings] = useState<LegalSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("legal_privacy_policy");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", Object.keys(defaultSettings));
      if (error) throw error;

      const loadedSettings: LegalSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof LegalSettings;
        if (key in loadedSettings) {
          loadedSettings[key] = (row.value as string) || "";
        }
      });
      setSettings(loadedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!isAdmin) {
      toast({ title: "Only admins can change settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      toast({ title: "Legal pages saved" });
    } catch (error: any) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
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
          <h1 className="text-3xl font-bold">Legal Pages</h1>
          <p className="text-muted-foreground">Edit your legal documents (HTML supported)</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            {legalPages.map((page) => (
              <TabsTrigger key={page.key} value={page.key} className="gap-2">
                <page.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{page.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {legalPages.map((page) => (
            <TabsContent key={page.key} value={page.key}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <page.icon className="w-5 h-5 text-primary" />
                  {page.label}
                </div>
                <p className="text-sm text-muted-foreground">
                  You can use HTML tags like &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt; etc.
                </p>
                <Textarea
                  value={settings[page.key as keyof LegalSettings]}
                  onChange={(e) => setSettings({ ...settings, [page.key]: e.target.value })}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder={`<h2>${page.label}</h2>\n<p>Your content here...</p>`}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
}
