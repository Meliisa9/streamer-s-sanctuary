import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Send, Users, User, Megaphone, Gift, Calendar, Trophy, Loader2, 
  Bell, Clock, History, Search, CheckCircle, AlertCircle, Info,
  Zap, Star, MessageSquare, Sparkles, Target, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import { format } from "date-fns";

const notificationTypes = [
  { value: "system", label: "System Announcement", icon: Megaphone, color: "bg-blue-500/20 text-blue-500" },
  { value: "giveaway", label: "Giveaway", icon: Gift, color: "bg-purple-500/20 text-purple-500" },
  { value: "event", label: "Event", icon: Calendar, color: "bg-green-500/20 text-green-500" },
  { value: "achievement", label: "Achievement", icon: Trophy, color: "bg-yellow-500/20 text-yellow-500" },
  { value: "alert", label: "Alert", icon: AlertCircle, color: "bg-red-500/20 text-red-500" },
  { value: "info", label: "Information", icon: Info, color: "bg-cyan-500/20 text-cyan-500" },
  { value: "reward", label: "Reward", icon: Star, color: "bg-amber-500/20 text-amber-500" },
  { value: "social", label: "Social", icon: MessageSquare, color: "bg-pink-500/20 text-pink-500" },
];

const quickTemplates = [
  { title: "Welcome!", message: "Welcome to our community! Check out the latest giveaways and events.", type: "system", icon: Sparkles },
  { title: "New Giveaway!", message: "A new giveaway is live! Don't miss your chance to win.", type: "giveaway", icon: Gift },
  { title: "Stream Starting Soon", message: "We're going live in 30 minutes! Join us for some action.", type: "event", icon: Zap },
  { title: "Maintenance Notice", message: "The site will undergo maintenance tonight. Thank you for your patience.", type: "alert", icon: AlertCircle },
];

export default function AdminSendNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("system");
  const [link, setLink] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["all-users-for-notifications", userSearch],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .order("username");
      
      if (userSearch) {
        query = query.or(`username.ilike.%${userSearch}%,display_name.ilike.%${userSearch}%`);
      }
      
      const { data } = await query.limit(50);
      return data || [];
    },
  });

  const { data: recentNotifications } = useQuery({
    queryKey: ["recent-admin-notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["notification-stats"],
    queryFn: async () => {
      const { count: totalCount } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true });
      
      const { count: unreadCount } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      
      const { count: todayCount } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().split("T")[0]);
      
      return {
        total: totalCount || 0,
        unread: unreadCount || 0,
        today: todayCount || 0,
      };
    },
  });

  const applyTemplate = (template: typeof quickTemplates[0]) => {
    setTitle(template.title);
    setMessage(template.message);
    setType(template.type);
  };

  const handleSend = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setIsSending(true);

    try {
      if (recipient === "all") {
        const { data: allUsers, error: usersError } = await supabase
          .from("profiles")
          .select("user_id");

        if (usersError) throw usersError;

        const notifications = allUsers?.map((user) => ({
          user_id: user.user_id,
          type,
          title: title.trim(),
          message: message.trim() || null,
          link: link.trim() || null,
        })) || [];

        if (notifications.length > 0) {
          const { error } = await supabase
            .from("user_notifications")
            .insert(notifications);

          if (error) throw error;
        }

        toast({
          title: "Notifications sent!",
          description: `Sent to ${notifications.length} users`,
        });
      } else {
        if (!selectedUserId) {
          toast({ title: "Please select a user", variant: "destructive" });
          setIsSending(false);
          return;
        }

        const { error } = await supabase.from("user_notifications").insert({
          user_id: selectedUserId,
          type,
          title: title.trim(),
          message: message.trim() || null,
          link: link.trim() || null,
        });

        if (error) throw error;

        toast({ title: "Notification sent!" });
      }

      queryClient.invalidateQueries({ queryKey: ["recent-admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });

      setTitle("");
      setMessage("");
      setLink("");
      setType("system");
      setIsPriority(false);
    } catch (error: any) {
      toast({
        title: "Failed to send notifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getTypeIcon = (t: string) => {
    const typeConfig = notificationTypes.find((n) => n.value === t);
    if (!typeConfig) return <Megaphone className="w-4 h-4" />;
    const Icon = typeConfig.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeColor = (t: string) => {
    return notificationTypes.find((n) => n.value === t)?.color || "bg-secondary text-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Send Notifications</h2>
          <p className="text-muted-foreground">Broadcast messages to your community</p>
        </div>
      </div>

      <AdminSettingsNav />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.total.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">Total Sent</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-4 flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-amber-500/10">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.unread.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">Unread</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-green-500/10">
            <Clock className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.today || 0}</p>
            <p className="text-sm text-muted-foreground">Sent Today</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 glass rounded-2xl p-6"
        >
          <Tabs defaultValue="compose">
            <TabsList className="mb-6">
              <TabsTrigger value="compose" className="gap-2">
                <Send className="w-4 h-4" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6">
              {/* Recipient Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Recipients</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={recipient === "all" ? "default" : "outline"}
                    onClick={() => setRecipient("all")}
                    className="gap-2 flex-1"
                  >
                    <Users className="w-4 h-4" />
                    All Users
                  </Button>
                  <Button
                    type="button"
                    variant={recipient === "single" ? "default" : "outline"}
                    onClick={() => setRecipient("single")}
                    className="gap-2 flex-1"
                  >
                    <User className="w-4 h-4" />
                    Specific User
                  </Button>
                </div>
              </div>

              {/* User Selection (if single) */}
              {recipient === "single" && (
                <div className="space-y-3">
                  <Label>Select User</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          <div className="flex items-center gap-2">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} className="w-5 h-5 rounded-full" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                            {user.display_name || user.username || "Unknown User"}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notification Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Notification Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {notificationTypes.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          type === t.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${t.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium">{t.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Title *</Label>
                <Input
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Message */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Message</Label>
                <Textarea
                  placeholder="Notification message (optional)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Link */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Link (optional)</Label>
                <Input
                  placeholder="/giveaways or https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Users can click the notification to navigate to this link
                </p>
              </div>

              {/* Priority Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Priority Notification</p>
                    <p className="text-sm text-muted-foreground">Show as a popup</p>
                  </div>
                </div>
                <Switch checked={isPriority} onCheckedChange={setIsPriority} />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={isSending || !title.trim()}
                className="w-full gap-2 h-12 text-lg"
                variant="glow"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {isSending ? "Sending..." : `Send to ${recipient === "all" ? "All Users" : "Selected User"}`}
              </Button>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <p className="text-muted-foreground">
                Click a template to quickly fill in the notification form.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {quickTemplates.map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => applyTemplate(template)}
                      className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(template.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="font-semibold">{template.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.message}</p>
                    </motion.button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Sidebar - Preview & History */}
        <div className="space-y-6">
          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Preview
            </h3>
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(type)}`}>
                  {getTypeIcon(type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{title || "Notification title"}</p>
                  {message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Just now</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Notifications
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentNotifications?.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1 rounded ${getTypeColor(notif.type)}`}>
                      {getTypeIcon(notif.type)}
                    </div>
                    <p className="text-sm font-medium truncate flex-1">{notif.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notif.created_at), "MMM d, HH:mm")}
                  </p>
                </div>
              ))}
              {!recentNotifications?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent notifications
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
