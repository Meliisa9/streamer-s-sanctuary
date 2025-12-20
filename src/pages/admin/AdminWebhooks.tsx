import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Webhook, Plus, Save, Loader2, Trash2, Edit2, 
  Check, X, Play, Pause, Globe, Bell, AlertTriangle,
  Copy, ExternalLink, RefreshCw, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret?: string;
  headers?: Record<string, string>;
  created_at: string;
  last_triggered_at?: string;
  failure_count: number;
}

const eventTypes = [
  { key: "giveaway.created", label: "Giveaway Created", category: "Giveaways" },
  { key: "giveaway.ended", label: "Giveaway Ended", category: "Giveaways" },
  { key: "giveaway.winner", label: "Winner Selected", category: "Giveaways" },
  { key: "event.created", label: "Event Created", category: "Events" },
  { key: "event.starting", label: "Event Starting Soon", category: "Events" },
  { key: "video.published", label: "Video Published", category: "Content" },
  { key: "article.published", label: "Article Published", category: "Content" },
  { key: "bonus_hunt.started", label: "Bonus Hunt Started", category: "Gaming" },
  { key: "bonus_hunt.completed", label: "Bonus Hunt Completed", category: "Gaming" },
  { key: "user.registered", label: "New User Registered", category: "Users" },
  { key: "stream.live", label: "Stream Went Live", category: "Stream" },
  { key: "stream.offline", label: "Stream Went Offline", category: "Stream" },
];

const examplePayloads: Record<string, object> = {
  "giveaway.created": {
    event: "giveaway.created",
    data: {
      id: "uuid",
      title: "Example Giveaway",
      prize: "$100 Gift Card",
      end_date: "2024-12-31T23:59:59Z"
    },
    timestamp: new Date().toISOString()
  },
  "stream.live": {
    event: "stream.live",
    data: {
      channel: "example_channel",
      platform: "kick",
      title: "Live Stream Title"
    },
    timestamp: new Date().toISOString()
  }
};

export default function AdminWebhooks() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<WebhookConfig | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    events: [] as string[],
    secret: "",
    headers: "",
  });

  // Fetch webhooks from site_settings
  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "webhooks")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      const value = data?.value;
      if (Array.isArray(value)) return value as unknown as WebhookConfig[];
      return [];
    },
  });

  // Save webhooks
  const saveWebhooks = useMutation({
    mutationFn: async (newWebhooks: WebhookConfig[]) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "webhooks", value: newWebhooks as any }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    let headers: Record<string, string> = {};
    if (formData.headers) {
      try {
        headers = JSON.parse(formData.headers);
      } catch {
        toast({ title: "Invalid headers JSON", variant: "destructive" });
        return;
      }
    }

    const webhook: WebhookConfig = {
      id: editingWebhook?.id || crypto.randomUUID(),
      name: formData.name,
      url: formData.url,
      events: formData.events,
      is_active: true,
      secret: formData.secret || undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      created_at: editingWebhook?.created_at || new Date().toISOString(),
      failure_count: editingWebhook?.failure_count || 0,
    };

    const newWebhooks = editingWebhook
      ? webhooks.map((w) => (w.id === editingWebhook.id ? webhook : w))
      : [...webhooks, webhook];

    await saveWebhooks.mutateAsync(newWebhooks);
    toast({ title: editingWebhook ? "Webhook updated" : "Webhook created" });
    resetForm();
  };

  const deleteWebhook = async (id: string) => {
    const newWebhooks = webhooks.filter((w) => w.id !== id);
    await saveWebhooks.mutateAsync(newWebhooks);
    toast({ title: "Webhook deleted" });
  };

  const toggleWebhook = async (id: string) => {
    const newWebhooks = webhooks.map((w) =>
      w.id === id ? { ...w, is_active: !w.is_active } : w
    );
    await saveWebhooks.mutateAsync(newWebhooks);
    toast({ title: "Webhook status updated" });
  };

  const resetForm = () => {
    setFormData({ name: "", url: "", events: [], secret: "", headers: "" });
    setEditingWebhook(null);
    setDialogOpen(false);
  };

  const openEditDialog = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret || "",
      headers: webhook.headers ? JSON.stringify(webhook.headers, null, 2) : "",
    });
    setDialogOpen(true);
  };

  const toggleEvent = (eventKey: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventKey)
        ? prev.events.filter((e) => e !== eventKey)
        : [...prev.events, eventKey],
    }));
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    setTestingWebhook(webhook);
    setTestDialogOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedEvents = eventTypes.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof eventTypes>);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Webhook Notifications"
        description="Configure webhooks to receive real-time event notifications"
        icon={Webhook}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Webhook
          </Button>
        }
      />

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
      >
        <Webhook className="w-5 h-5 text-purple-500 mt-0.5" />
        <div>
          <p className="font-medium text-purple-500">Webhooks</p>
          <p className="text-sm text-muted-foreground">
            Send HTTP POST requests to external services when events occur. Great for Discord, Slack, or custom integrations.
          </p>
        </div>
      </motion.div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Webhook className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Webhooks Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first webhook to start receiving event notifications
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook, index) => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${webhook.is_active ? "bg-green-500/10" : "bg-gray-500/10"}`}>
                        {webhook.is_active ? (
                          <Zap className="w-5 h-5 text-green-500" />
                        ) : (
                          <Pause className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {webhook.name}
                          <Badge variant={webhook.is_active ? "default" : "secondary"}>
                            {webhook.is_active ? "Active" : "Paused"}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Globe className="w-3 h-3" />
                          {webhook.url.substring(0, 50)}...
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => toggleWebhook(webhook.id)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => testWebhook(webhook)}>
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(webhook)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWebhook(webhook.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {eventTypes.find((e) => e.key === event)?.label || event}
                      </Badge>
                    ))}
                  </div>
                  {webhook.failure_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-500">
                      <AlertTriangle className="w-4 h-4" />
                      {webhook.failure_count} failed delivery attempts
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-primary" />
              {editingWebhook ? "Edit Webhook" : "Create Webhook"}
            </DialogTitle>
            <DialogDescription>
              Configure webhook endpoint and events to listen for
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Discord Notifications"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Secret (optional)</label>
                <Input
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="webhook_secret_key"
                  type="password"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Endpoint URL *</label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Custom Headers (JSON)</label>
              <Textarea
                value={formData.headers}
                onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                placeholder='{"Authorization": "Bearer token"}'
                rows={2}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Events *</label>
              <div className="space-y-4">
                {Object.entries(groupedEvents).map(([category, events]) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{category}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {events.map((event) => (
                        <button
                          key={event.key}
                          type="button"
                          onClick={() => toggleEvent(event.key)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all ${
                            formData.events.includes(event.key)
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 hover:bg-secondary"
                          }`}
                        >
                          {formData.events.includes(event.key) ? (
                            <Check className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                          )}
                          {event.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveWebhooks.isPending} className="gap-2">
              {saveWebhooks.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingWebhook ? "Update" : "Create"} Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-500" />
              Test Webhook
            </DialogTitle>
            <DialogDescription>
              Send a test payload to {testingWebhook?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm mb-3">Example payload that will be sent:</p>
            <pre className="p-3 rounded-lg bg-secondary/50 text-xs overflow-x-auto">
              {JSON.stringify(examplePayloads["giveaway.created"], null, 2)}
            </pre>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({ title: "Test webhook sent (simulated)" });
                setTestDialogOpen(false);
              }}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
