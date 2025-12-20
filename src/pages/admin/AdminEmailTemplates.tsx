import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Mail, Loader2, Eye, Code, Copy, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import { useAuth } from "@/contexts/AuthContext";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  template_type: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const templateTypes = [
  { value: "system", label: "System" },
  { value: "giveaway", label: "Giveaway" },
  { value: "event", label: "Event" },
  { value: "bonus_hunt", label: "Bonus Hunt" },
  { value: "social", label: "Social" },
  { value: "notification", label: "Notification" },
];

const typeColors: Record<string, string> = {
  system: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  giveaway: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  event: "bg-green-500/10 text-green-500 border-green-500/20",
  bonus_hunt: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  social: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  notification: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

// Premium pre-made templates
const premadeTemplates = [
  {
    name: "welcome_user",
    subject: "Welcome to {{site_name}} - Your Casino Streaming Journey Begins! 🎰",
    template_type: "system",
    variables: "username, site_name",
    body_html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(145deg, #16213e 0%, #1a1a2e 100%); border-radius: 24px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">🎰</span>
        </div>
        <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 700;">Welcome, {{username}}!</h1>
        <p style="color: #a78bfa; font-size: 16px; margin-top: 8px;">Your journey to epic wins starts here</p>
      </div>
      <div style="background: rgba(139, 92, 246, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.7; margin: 0;">You've just joined the most exciting casino streaming community. Get ready for exclusive giveaways, bonus hunts, and unforgettable moments!</p>
      </div>
      <div style="display: grid; gap: 12px; margin-bottom: 32px;">
        <div style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 16px; border-left: 4px solid #10b981;">
          <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 0;">✓ Access to exclusive giveaways</p>
        </div>
        <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 16px; border-left: 4px solid #3b82f6;">
          <p style="color: #3b82f6; font-size: 14px; font-weight: 600; margin: 0;">✓ Participate in bonus hunt predictions</p>
        </div>
        <div style="background: rgba(236, 72, 153, 0.1); border-radius: 12px; padding: 16px; border-left: 4px solid #ec4899;">
          <p style="color: #ec4899; font-size: 14px; font-weight: 600; margin: 0;">✓ Earn points & climb the leaderboard</p>
        </div>
      </div>
      <a href="{{site_url}}" style="display: block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #fff; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Start Exploring</a>
    </div>
    <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">© {{site_name}} - The Ultimate Casino Streaming Experience</p>
  </div>
</body>
</html>`,
  },
  {
    name: "giveaway_winner",
    subject: "🎉 CONGRATULATIONS! You Won the {{giveaway_name}} Giveaway!",
    template_type: "giveaway",
    variables: "username, giveaway_name, prize, claim_link, site_name",
    body_html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(145deg, #16213e 0%, #1a1a2e 100%); border-radius: 24px; padding: 40px; border: 1px solid rgba(250, 204, 21, 0.4); box-shadow: 0 25px 50px -12px rgba(250, 204, 21, 0.2);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
        <h1 style="color: #facc15; font-size: 32px; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">YOU WON!</h1>
        <p style="color: #fef08a; font-size: 18px; margin-top: 8px;">{{username}}, you're a winner!</p>
      </div>
      <div style="background: linear-gradient(135deg, rgba(250, 204, 21, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; text-align: center; border: 2px solid rgba(250, 204, 21, 0.3);">
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Your Prize</p>
        <p style="color: #fff; font-size: 28px; font-weight: 700; margin: 0;">{{prize}}</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 12px;">from {{giveaway_name}}</p>
      </div>
      <a href="{{claim_link}}" style="display: block; background: linear-gradient(135deg, #facc15 0%, #eab308 100%); color: #1a1a2e; text-decoration: none; text-align: center; padding: 18px 32px; border-radius: 12px; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Claim Your Prize</a>
      <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 24px;">Please claim within 48 hours or the prize may be forfeited.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "event_reminder",
    subject: "⏰ Starting Soon: {{event_name}} - Don't Miss Out!",
    template_type: "event",
    variables: "username, event_name, event_time, event_description, watch_link, site_name",
    body_html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(145deg, #16213e 0%, #1a1a2e 100%); border-radius: 24px; padding: 40px; border: 1px solid rgba(59, 130, 246, 0.3);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 16px 32px; border-radius: 50px; margin-bottom: 20px;">
          <span style="color: #fff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">⏰ STARTING SOON</span>
        </div>
        <h1 style="color: #fff; font-size: 26px; margin: 0;">{{event_name}}</h1>
      </div>
      <div style="background: rgba(59, 130, 246, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <span style="font-size: 24px;">🕐</span>
          <div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-transform: uppercase;">When</p>
            <p style="color: #3b82f6; font-size: 18px; font-weight: 600; margin: 0;">{{event_time}}</p>
          </div>
        </div>
        <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin: 0;">{{event_description}}</p>
      </div>
      <a href="{{watch_link}}" style="display: block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #fff; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Set Reminder</a>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "bonus_hunt_winner",
    subject: "🎯 Your Bonus Hunt Prediction Won! +{{points}} Points",
    template_type: "bonus_hunt",
    variables: "username, hunt_name, guess, actual_result, points, site_name",
    body_html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(145deg, #16213e 0%, #1a1a2e 100%); border-radius: 24px; padding: 40px; border: 1px solid rgba(16, 185, 129, 0.3);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 56px; margin-bottom: 16px;">🎯</div>
        <h1 style="color: #10b981; font-size: 28px; margin: 0;">Bullseye, {{username}}!</h1>
        <p style="color: #6ee7b7; font-size: 16px; margin-top: 8px;">Your prediction was spot on</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: rgba(16, 185, 129, 0.1); border-radius: 16px; padding: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Your Guess</p>
          <p style="color: #fff; font-size: 24px; font-weight: 700; margin: 0;">{{guess}}</p>
        </div>
        <div style="background: rgba(16, 185, 129, 0.1); border-radius: 16px; padding: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Actual Result</p>
          <p style="color: #10b981; font-size: 24px; font-weight: 700; margin: 0;">{{actual_result}}</p>
        </div>
      </div>
      <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%); border-radius: 20px; padding: 24px; text-align: center; border: 2px solid rgba(16, 185, 129, 0.3);">
        <p style="color: #6ee7b7; font-size: 14px; margin: 0 0 8px 0;">Points Earned</p>
        <p style="color: #10b981; font-size: 36px; font-weight: 800; margin: 0;">+{{points}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "new_follower",
    subject: "{{follower_name}} just followed you on {{site_name}}! 👋",
    template_type: "social",
    variables: "username, follower_name, follower_link, site_name",
    body_html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(145deg, #16213e 0%, #1a1a2e 100%); border-radius: 24px; padding: 40px; border: 1px solid rgba(236, 72, 153, 0.3);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px;">👋</div>
        <h1 style="color: #fff; font-size: 24px; margin: 0;">New Follower!</h1>
      </div>
      <div style="background: rgba(236, 72, 153, 0.1); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #f472b6; font-size: 20px; font-weight: 600; margin: 0;">{{follower_name}}</p>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">is now following you</p>
      </div>
      <a href="{{follower_link}}" style="display: block; background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: #fff; text-decoration: none; text-align: center; padding: 14px 28px; border-radius: 12px; font-weight: 600;">View Profile</a>
    </div>
  </div>
</body>
</html>`,
  },
];

export default function AdminEmailTemplates() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    template_type: "notification",
    variables: "",
    is_active: true,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_type", { ascending: true });
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const variables = data.variables.split(",").map(v => v.trim()).filter(Boolean);
      const { error } = await supabase.from("email_templates").insert({
        name: data.name,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text || null,
        template_type: data.template_type,
        variables,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const variables = data.variables.split(",").map(v => v.trim()).filter(Boolean);
      const { error } = await supabase.from("email_templates").update({
        name: data.name,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text || null,
        template_type: data.template_type,
        variables,
        is_active: data.is_active,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("email_templates").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", subject: "", body_html: "", body_text: "", template_type: "notification", variables: "", is_active: true });
    setEditingTemplate(null);
    setPreviewTab("edit");
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text || "",
      template_type: template.template_type,
      variables: (template.variables || []).join(", "),
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(`{{${varName}}}`);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const renderPreview = () => {
    let html = formData.body_html;
    const variables = formData.variables.split(",").map(v => v.trim()).filter(Boolean);
    variables.forEach(v => {
      html = html.replace(new RegExp(`{{${v}}}`, "g"), `<span class="bg-primary/20 px-1 rounded">[${v}]</span>`);
    });
    return html;
  };

  // Add premade templates
  const addPremadeTemplates = useMutation({
    mutationFn: async () => {
      for (const template of premadeTemplates) {
        const variables = template.variables.split(",").map(v => v.trim());
        const { error } = await supabase.from("email_templates").insert({
          name: template.name,
          subject: template.subject,
          body_html: template.body_html,
          template_type: template.template_type,
          variables,
          is_active: true,
        });
        if (error && !error.message.includes("duplicate")) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Premium templates added!", description: "5 professionally designed templates are now available." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage email notification templates</p>
        </div>
        <div className="flex items-center gap-2">
          {templates.length === 0 && (
            <Button 
              variant="outline" 
              onClick={() => addPremadeTemplates.mutate()}
              disabled={addPremadeTemplates.isPending}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Add Premium Templates
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Template" : "Add New Template"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., welcome, giveaway_winner"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.template_type} onValueChange={(value) => setFormData({ ...formData, template_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject Line *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Welcome to {{site_name}}!"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Variables (comma-separated)</Label>
                  <Input
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    placeholder="username, site_name, prize"
                  />
                  <p className="text-xs text-muted-foreground">Use {"{{variable_name}}"} in your template to insert dynamic content</p>
                </div>

                <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as "edit" | "preview")}>
                  <TabsList>
                    <TabsTrigger value="edit" className="gap-2"><Code className="w-4 h-4" /> Edit HTML</TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2"><Eye className="w-4 h-4" /> Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="space-y-2">
                    <Label>HTML Body *</Label>
                    <Textarea
                      value={formData.body_html}
                      onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                      placeholder="<h1>Hello {{username}}!</h1>"
                      rows={10}
                      className="font-mono text-sm"
                      required
                    />
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="border border-border rounded-xl p-4 bg-white text-black min-h-[200px]">
                      <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label>Plain Text Body (fallback)</Label>
                  <Textarea
                    value={formData.body_text}
                    onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                    placeholder="Hello {{username}}! ..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AdminSettingsNav />

      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant="outline" className={typeColors[template.template_type]}>
                      {template.template_type}
                    </Badge>
                    {!template.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((v: string) => (
                        <button
                          key={v}
                          onClick={() => copyVariable(v)}
                          className="px-2 py-0.5 bg-secondary text-xs rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          {copiedVar === v ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: template.id, is_active: checked })}
                />
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No email templates yet. Click "Add Premium Templates" to get started with professionally designed templates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
