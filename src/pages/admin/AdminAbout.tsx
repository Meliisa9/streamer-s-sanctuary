import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Info, Image, Bold, Italic, Link2, Type, Film, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface AboutSettings {
  about_title: string;
  about_subtitle: string;
  about_content: string;
  about_image: string;
  about_mission_title: string;
  about_mission_content: string;
  about_team_title: string;
  about_team_content: string;
}

const defaultSettings: AboutSettings = {
  about_title: "About Us",
  about_subtitle: "Your trusted destination for casino streaming entertainment",
  about_content: "",
  about_image: "",
  about_mission_title: "Our Mission",
  about_mission_content: "To provide the most entertaining and transparent casino streaming experience.",
  about_team_title: "The Team",
  about_team_content: "Meet the passionate individuals behind the streams.",
};

export default function AdminAbout() {
  const [settings, setSettings] = useState<AboutSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedSettings: AboutSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof AboutSettings;
        if (key in loadedSettings) {
          (loadedSettings as Record<string, any>)[key] = row.value ?? defaultSettings[key];
        }
      });

      setSettings(loadedSettings);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadMedia = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `about-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
      return publicUrl;
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const insertMediaInContent = async (type: "image" | "video") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "video" ? "video/*" : "image/*";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const url = await uploadMedia(file);
      if (!url) return;

      let mediaHtml = "";
      if (type === "video") {
        mediaHtml = `\n<video controls class="w-full max-w-2xl rounded-lg my-4 mx-auto"><source src="${url}" type="${file.type}"></video>\n`;
      } else {
        mediaHtml = `\n<img src="${url}" alt="About image" class="w-full max-w-2xl rounded-lg my-4 mx-auto" />\n`;
      }

      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = settings.about_content.substring(0, start) + mediaHtml + settings.about_content.substring(end);
        setSettings({ ...settings, about_content: newContent });
      } else {
        setSettings({ ...settings, about_content: settings.about_content + mediaHtml });
      }

      toast({ title: `${type === "video" ? "Video" : "Image"} inserted` });
    };

    input.click();
  };

  const insertFormatting = (format: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = settings.about_content.substring(start, end);
    
    let formattedText = "";
    
    switch (format) {
      case "bold":
        formattedText = `<strong>${selectedText || "bold text"}</strong>`;
        break;
      case "italic":
        formattedText = `<em>${selectedText || "italic text"}</em>`;
        break;
      case "link":
        const url = prompt("Enter URL:", "https://");
        if (!url) return;
        formattedText = `<a href="${url}" class="text-primary hover:underline">${selectedText || "link text"}</a>`;
        break;
      case "h2":
        formattedText = `<h2 class="text-2xl font-bold my-4">${selectedText || "Heading"}</h2>`;
        break;
      default:
        return;
    }

    const newContent = settings.about_content.substring(0, start) + formattedText + settings.about_content.substring(end);
    setSettings({ ...settings, about_content: newContent });
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadMedia(file);
    if (url) {
      setSettings({ ...settings, about_image: url });
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

      toast({ title: "About page saved" });
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
      <AdminSettingsNav />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">About Page</h2>
          <p className="text-muted-foreground">Customize your About Us page content</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Hero Section
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Page Title</label>
              <input
                type="text"
                value={settings.about_title}
                onChange={(e) => setSettings({ ...settings, about_title: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subtitle</label>
              <input
                type="text"
                value={settings.about_subtitle}
                onChange={(e) => setSettings({ ...settings, about_subtitle: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hero Image</label>
              <div className="mt-1 flex items-center gap-4">
                {settings.about_image ? (
                  <img src={settings.about_image} alt="Hero" className="w-24 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-24 h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground text-xs">No image</div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
                  <Button variant="outline" type="button" asChild disabled={isUploading}>
                    <span>{isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Upload Image</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Main Content</h3>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap p-2 bg-secondary/50 rounded-lg">
              <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("bold")} title="Bold">
                <Bold className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("italic")} title="Italic">
                <Italic className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("link")} title="Link">
                <Link2 className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("h2")} title="Heading">
                <Type className="w-4 h-4" />
              </Button>
              <div className="h-6 w-px bg-border mx-1" />
              <Button type="button" variant="ghost" size="sm" onClick={() => insertMediaInContent("image")} disabled={isUploading}>
                <Image className="w-4 h-4 mr-1" /> Image
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => insertMediaInContent("video")} disabled={isUploading}>
                <Film className="w-4 h-4 mr-1" /> Video
              </Button>
            </div>
            <Textarea
              ref={contentRef}
              value={settings.about_content}
              onChange={(e) => setSettings({ ...settings, about_content: e.target.value })}
              placeholder="Write your about page content here... HTML is supported."
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Mission Section</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={settings.about_mission_title}
                  onChange={(e) => setSettings({ ...settings, about_mission_title: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={settings.about_mission_content}
                  onChange={(e) => setSettings({ ...settings, about_mission_content: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Team Section</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={settings.about_team_title}
                  onChange={(e) => setSettings({ ...settings, about_team_title: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={settings.about_team_content}
                  onChange={(e) => setSettings({ ...settings, about_team_content: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
