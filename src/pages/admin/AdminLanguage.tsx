import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Save, Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

type SupportedLanguage = "en" | "de" | "es" | "fr" | "pt" | "it" | "nl" | "sv" | "no" | "fi" | "da" | "pl" | "ru" | "ja" | "ko" | "zh";

const availableLanguages: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
];

const defaultTranslationKeys = [
  { key: "nav.home", defaultValue: "Home" },
  { key: "nav.videos", defaultValue: "Videos" },
  { key: "nav.bonuses", defaultValue: "Bonuses" },
  { key: "nav.news", defaultValue: "News" },
  { key: "nav.giveaways", defaultValue: "Giveaways" },
  { key: "nav.events", defaultValue: "Events" },
  { key: "nav.leaderboard", defaultValue: "Leaderboard" },
  { key: "nav.polls", defaultValue: "Polls" },
  { key: "nav.about", defaultValue: "About" },
  { key: "nav.predictions", defaultValue: "Predictions" },
  { key: "nav.wins", defaultValue: "Win Gallery" },
  { key: "auth.login", defaultValue: "Login" },
  { key: "auth.signup", defaultValue: "Sign Up" },
  { key: "auth.logout", defaultValue: "Logout" },
  { key: "common.save", defaultValue: "Save" },
  { key: "common.cancel", defaultValue: "Cancel" },
  { key: "common.delete", defaultValue: "Delete" },
  { key: "common.search", defaultValue: "Search" },
];

export default function AdminLanguage() {
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>("en");
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [customKeys, setCustomKeys] = useState<{ key: string; defaultValue: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [newKey, setNewKey] = useState({ key: "", defaultValue: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslations(selectedLanguage);
    }
  }, [selectedLanguage]);

  const fetchSettings = async () => {
    try {
      const { data: langSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "default_language")
        .single();

      if (langSetting?.value) {
        setDefaultLanguage(langSetting.value as SupportedLanguage);
      }

      const { data: customKeysSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "custom_translation_keys")
        .single();

      if (customKeysSetting?.value && Array.isArray(customKeysSetting.value)) {
        setCustomKeys(customKeysSetting.value);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTranslations = async (lang: SupportedLanguage) => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", `translations_${lang}`)
        .single();

      if (data?.value && typeof data.value === "object") {
        setTranslations(data.value as Record<string, string>);
      } else {
        setTranslations({});
      }
    } catch (error) {
      setTranslations({});
    }
  };

  const saveDefaultLanguage = async () => {
    setIsSaving(true);
    try {
      await supabase
        .from("site_settings")
        .upsert({ key: "default_language", value: defaultLanguage }, { onConflict: "key" });
      toast({ title: "Default language saved" });
    } catch (error) {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveTranslations = async () => {
    setIsSaving(true);
    try {
      await supabase
        .from("site_settings")
        .upsert(
          { key: `translations_${selectedLanguage}`, value: translations },
          { onConflict: "key" }
        );
      toast({ title: `${availableLanguages.find((l) => l.code === selectedLanguage)?.name} translations saved` });
    } catch (error) {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomKey = async () => {
    if (!newKey.key || !newKey.defaultValue) {
      toast({ title: "Please fill in both fields", variant: "destructive" });
      return;
    }

    const updatedKeys = [...customKeys, newKey];
    setCustomKeys(updatedKeys);

    await supabase
      .from("site_settings")
      .upsert({ key: "custom_translation_keys", value: updatedKeys }, { onConflict: "key" });

    setNewKey({ key: "", defaultValue: "" });
    setNewKeyDialog(false);
    toast({ title: "Custom key added" });
  };

  const removeCustomKey = async (keyToRemove: string) => {
    const updatedKeys = customKeys.filter((k) => k.key !== keyToRemove);
    setCustomKeys(updatedKeys);

    await supabase
      .from("site_settings")
      .upsert({ key: "custom_translation_keys", value: updatedKeys }, { onConflict: "key" });

    toast({ title: "Custom key removed" });
  };

  const allKeys = [...defaultTranslationKeys, ...customKeys];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Language Settings"
        description="Configure website language and manage translations"
      />
      <AdminSettingsNav />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="translations" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Translations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Default Language</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={defaultLanguage} onValueChange={(v: SupportedLanguage) => setDefaultLanguage(v)}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          {lang.nativeName} ({lang.name})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={saveDefaultLanguage} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This is the default language visitors will see when they first visit your site.
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Custom Translation Keys</CardTitle>
              <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Translation Key</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Key (e.g., custom.myLabel)</Label>
                      <Input
                        value={newKey.key}
                        onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                        placeholder="custom.myLabel"
                      />
                    </div>
                    <div>
                      <Label>Default Value (English)</Label>
                      <Input
                        value={newKey.defaultValue}
                        onChange={(e) => setNewKey({ ...newKey, defaultValue: e.target.value })}
                        placeholder="My Label"
                      />
                    </div>
                    <Button onClick={addCustomKey} className="w-full">
                      Add Key
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {customKeys.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No custom keys added yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Default Value</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customKeys.map((key) => (
                      <TableRow key={key.key}>
                        <TableCell className="font-mono text-sm">{key.key}</TableCell>
                        <TableCell>{key.defaultValue}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeCustomKey(key.key)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translations" className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Translations</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={selectedLanguage} onValueChange={(v: SupportedLanguage) => setSelectedLanguage(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={saveTranslations} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Key</TableHead>
                      <TableHead className="w-48">Default (English)</TableHead>
                      <TableHead>Translation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allKeys.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell className="font-mono text-sm">{item.key}</TableCell>
                        <TableCell className="text-muted-foreground">{item.defaultValue}</TableCell>
                        <TableCell>
                          <Input
                            value={translations[item.key] || ""}
                            onChange={(e) =>
                              setTranslations({ ...translations, [item.key]: e.target.value })
                            }
                            placeholder={item.defaultValue}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
