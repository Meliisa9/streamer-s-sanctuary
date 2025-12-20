import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Save, Loader2, Info, Image, Bold, Italic, Link2, Type, Film, Upload, 
  Eye, Layout, Users, Target, Heart, Star, Quote, List, Heading1, Heading2,
  AlignLeft, AlignCenter, Sparkles, Trash2, Plus, GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  socials: { platform: string; url: string }[];
}

interface Stat {
  id: string;
  label: string;
  value: string;
  icon: string;
}

interface AboutSettings {
  about_title: string;
  about_subtitle: string;
  about_content: string;
  about_image: string;
  about_mission_title: string;
  about_mission_content: string;
  about_team_title: string;
  about_team_content: string;
  about_values_title: string;
  about_values: string[];
  about_stats: Stat[];
  about_team_members: TeamMember[];
  about_cta_title: string;
  about_cta_text: string;
  about_cta_button: string;
  about_cta_link: string;
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
  about_values_title: "Our Values",
  about_values: ["Transparency", "Entertainment", "Community", "Responsibility"],
  about_stats: [
    { id: "1", label: "Active Viewers", value: "10K+", icon: "users" },
    { id: "2", label: "Stream Hours", value: "5000+", icon: "clock" },
    { id: "3", label: "Giveaways Done", value: "500+", icon: "gift" },
  ],
  about_team_members: [],
  about_cta_title: "Join Our Community",
  about_cta_text: "Be part of the action! Follow us on Twitch and join our Discord.",
  about_cta_button: "Join Discord",
  about_cta_link: "#",
};

const formatButtons = [
  { icon: Bold, format: "bold", label: "Bold" },
  { icon: Italic, format: "italic", label: "Italic" },
  { icon: Heading1, format: "h1", label: "Heading 1" },
  { icon: Heading2, format: "h2", label: "Heading 2" },
  { icon: Link2, format: "link", label: "Link" },
  { icon: Quote, format: "quote", label: "Quote" },
  { icon: List, format: "list", label: "List" },
];

export default function AdminAbout() {
  const [settings, setSettings] = useState<AboutSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
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

      const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file, { upsert: true });
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
      case "h1":
        formattedText = `\n<h1 class="text-3xl font-bold my-6">${selectedText || "Heading"}</h1>\n`;
        break;
      case "h2":
        formattedText = `\n<h2 class="text-2xl font-bold my-4">${selectedText || "Heading"}</h2>\n`;
        break;
      case "link":
        const url = prompt("Enter URL:", "https://");
        if (!url) return;
        formattedText = `<a href="${url}" class="text-primary hover:underline">${selectedText || "link text"}</a>`;
        break;
      case "quote":
        formattedText = `\n<blockquote class="border-l-4 border-primary pl-4 italic my-4">${selectedText || "Quote text"}</blockquote>\n`;
        break;
      case "list":
        formattedText = `\n<ul class="list-disc list-inside my-4 space-y-2">\n  <li>${selectedText || "List item"}</li>\n  <li>Another item</li>\n</ul>\n`;
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

  const addValue = () => {
    setSettings({ ...settings, about_values: [...settings.about_values, "New Value"] });
  };

  const updateValue = (index: number, value: string) => {
    const newValues = [...settings.about_values];
    newValues[index] = value;
    setSettings({ ...settings, about_values: newValues });
  };

  const removeValue = (index: number) => {
    setSettings({ ...settings, about_values: settings.about_values.filter((_, i) => i !== index) });
  };

  const addStat = () => {
    setSettings({
      ...settings,
      about_stats: [...settings.about_stats, { id: Date.now().toString(), label: "New Stat", value: "0", icon: "star" }],
    });
  };

  const updateStat = (id: string, field: keyof Stat, value: string) => {
    setSettings({
      ...settings,
      about_stats: settings.about_stats.map((stat) => (stat.id === id ? { ...stat, [field]: value } : stat)),
    });
  };

  const removeStat = (id: string) => {
    setSettings({ ...settings, about_stats: settings.about_stats.filter((stat) => stat.id !== id) });
  };

  const addTeamMember = () => {
    setSettings({
      ...settings,
      about_team_members: [
        ...settings.about_team_members,
        { id: Date.now().toString(), name: "", role: "", image: "", bio: "", socials: [] },
      ],
    });
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: any) => {
    setSettings({
      ...settings,
      about_team_members: settings.about_team_members.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      ),
    });
  };

  const removeTeamMember = (id: string) => {
    setSettings({ ...settings, about_team_members: settings.about_team_members.filter((m) => m.id !== id) });
  };

  const uploadTeamMemberImage = async (memberId: string, file: File) => {
    const url = await uploadMedia(file);
    if (url) {
      updateTeamMember(memberId, "image", url);
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
          <p className="text-muted-foreground">Customize your About Us page content and layout</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="hero" className="gap-2">
            <Layout className="w-4 h-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Type className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="mission" className="gap-2">
            <Target className="w-4 h-4" />
            Mission
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Star className="w-4 h-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="cta" className="gap-2">
            <Sparkles className="w-4 h-4" />
            CTA
          </TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Hero Section
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input
                    value={settings.about_title}
                    onChange={(e) => setSettings({ ...settings, about_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Textarea
                    value={settings.about_subtitle}
                    onChange={(e) => setSettings({ ...settings, about_subtitle: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Hero Image</Label>
                <div className="mt-2">
                  {settings.about_image ? (
                    <div className="relative">
                      <img src={settings.about_image} alt="Hero" className="w-full h-48 rounded-xl object-cover" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setSettings({ ...settings, about_image: "" })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-secondary flex flex-col items-center justify-center border-2 border-dashed border-border">
                      <Image className="w-10 h-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No image uploaded</p>
                    </div>
                  )}
                  <label className="cursor-pointer mt-3 block">
                    <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
                    <Button variant="outline" type="button" asChild disabled={isUploading} className="w-full">
                      <span>
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload Image
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Content Section */}
        <TabsContent value="content" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Main Content</h3>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap p-3 bg-secondary/50 rounded-xl">
                {formatButtons.map((btn) => {
                  const Icon = btn.icon;
                  return (
                    <Button key={btn.format} type="button" variant="ghost" size="sm" onClick={() => insertFormatting(btn.format)} title={btn.label}>
                      <Icon className="w-4 h-4" />
                    </Button>
                  );
                })}
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
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Tip: You can use HTML tags for advanced formatting</p>
            </div>
          </motion.div>
        </TabsContent>

        {/* Mission & Values */}
        <TabsContent value="mission" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Mission Section
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={settings.about_mission_title}
                    onChange={(e) => setSettings({ ...settings, about_mission_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={settings.about_mission_content}
                    onChange={(e) => setSettings({ ...settings, about_mission_content: e.target.value })}
                    rows={5}
                    className="mt-1"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Our Values
                </h3>
                <Button variant="outline" size="sm" onClick={addValue} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
              <div>
                <Label>Values Title</Label>
                <Input
                  value={settings.about_values_title}
                  onChange={(e) => setSettings({ ...settings, about_values_title: e.target.value })}
                  className="mt-1 mb-4"
                />
              </div>
              <div className="space-y-2">
                {settings.about_values.map((value, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={value} onChange={(e) => updateValue(index, e.target.value)} className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeValue(index)} className="text-destructive shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Statistics
              </h3>
              <Button variant="outline" size="sm" onClick={addStat} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Stat
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.about_stats.map((stat) => (
                <div key={stat.id} className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{stat.icon}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeStat(stat.id)} className="text-destructive h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={stat.value}
                      onChange={(e) => updateStat(stat.id, "value", e.target.value)}
                      className="mt-1 text-2xl font-bold"
                      placeholder="10K+"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={stat.label}
                      onChange={(e) => updateStat(stat.id, "label", e.target.value)}
                      className="mt-1"
                      placeholder="Active Users"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Icon</Label>
                    <select
                      value={stat.icon}
                      onChange={(e) => updateStat(stat.id, "icon", e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    >
                      <option value="users">Users</option>
                      <option value="clock">Clock</option>
                      <option value="gift">Gift</option>
                      <option value="star">Star</option>
                      <option value="trophy">Trophy</option>
                      <option value="heart">Heart</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Team Members
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Add your team members</p>
              </div>
              <Button variant="outline" onClick={addTeamMember} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <Label>Team Section Title</Label>
                <Input
                  value={settings.about_team_title}
                  onChange={(e) => setSettings({ ...settings, about_team_title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Team Section Description</Label>
                <Textarea
                  value={settings.about_team_content}
                  onChange={(e) => setSettings({ ...settings, about_team_content: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.about_team_members.map((member) => (
                <div key={member.id} className="p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
                  <div className="flex items-start gap-4">
                    <div>
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-20 h-20 rounded-xl object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex gap-1 mt-2">
                        <label className="cursor-pointer flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadTeamMemberImage(member.id, file);
                            }}
                            className="hidden"
                          />
                          <Button variant="outline" type="button" asChild size="sm" className="w-full">
                            <span><Upload className="w-3 h-3 mr-1" />File</span>
                          </Button>
                        </label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const url = prompt("Enter image URL:");
                            if (url) updateTeamMember(member.id, "image", url);
                          }}
                        >
                          URL
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={member.name}
                            onChange={(e) => updateTeamMember(member.id, "name", e.target.value)}
                            placeholder="Name"
                          />
                          <Input
                            value={member.role}
                            onChange={(e) => updateTeamMember(member.id, "role", e.target.value)}
                            placeholder="Role"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeTeamMember(member.id)} className="text-destructive ml-2">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={member.bio}
                        onChange={(e) => updateTeamMember(member.id, "bio", e.target.value)}
                        placeholder="Short bio..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {settings.about_team_members.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No team members added yet. Click "Add Member" to get started.
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* CTA */}
        <TabsContent value="cta" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Call to Action Section
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>CTA Title</Label>
                  <Input
                    value={settings.about_cta_title}
                    onChange={(e) => setSettings({ ...settings, about_cta_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>CTA Text</Label>
                  <Textarea
                    value={settings.about_cta_text}
                    onChange={(e) => setSettings({ ...settings, about_cta_text: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={settings.about_cta_button}
                    onChange={(e) => setSettings({ ...settings, about_cta_button: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Button Link</Label>
                  <Input
                    value={settings.about_cta_link}
                    onChange={(e) => setSettings({ ...settings, about_cta_link: e.target.value })}
                    placeholder="https://discord.gg/..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Preview</Label>
                <div className="mt-2 p-6 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20">
                  <h4 className="text-xl font-bold mb-2">{settings.about_cta_title || "Call to Action"}</h4>
                  <p className="text-muted-foreground mb-4">{settings.about_cta_text || "Your CTA text here"}</p>
                  <Button variant="glow">{settings.about_cta_button || "Button"}</Button>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
