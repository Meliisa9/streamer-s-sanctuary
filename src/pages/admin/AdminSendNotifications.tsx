import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Users, User, Megaphone, Gift, Calendar, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

export default function AdminSendNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("system");
  const [link, setLink] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { data: users } = useQuery({
    queryKey: ["all-users-for-notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .order("username");
      return data || [];
    },
  });

  const handleSend = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setIsSending(true);

    try {
      if (recipient === "all") {
        // Get all user IDs
        const { data: allUsers, error: usersError } = await supabase
          .from("profiles")
          .select("user_id");

        if (usersError) throw usersError;

        // Insert notification for each user
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
        // Send to single user
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

      // Reset form
      setTitle("");
      setMessage("");
      setLink("");
      setType("system");
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
    switch (t) {
      case 'achievement': return <Trophy className="w-4 h-4" />;
      case 'giveaway': return <Gift className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      default: return <Megaphone className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Send Notifications</h2>
          <p className="text-muted-foreground">Send system notifications to users</p>
        </div>
      </div>

      <AdminSettingsNav />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 max-w-2xl"
      >
        <div className="space-y-6">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label>Send To</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={recipient === "all" ? "default" : "outline"}
                onClick={() => setRecipient("all")}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                All Users
              </Button>
              <Button
                type="button"
                variant={recipient === "single" ? "default" : "outline"}
                onClick={() => setRecipient("single")}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                Specific User
              </Button>
            </div>
          </div>

          {/* User Selection (if single) */}
          {recipient === "single" && (
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.display_name || user.username || "Unknown User"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notification Type */}
          <div className="space-y-2">
            <Label>Notification Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    System Announcement
                  </div>
                </SelectItem>
                <SelectItem value="giveaway">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Giveaway
                  </div>
                </SelectItem>
                <SelectItem value="event">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Event
                  </div>
                </SelectItem>
                <SelectItem value="achievement">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Achievement
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="Notification title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Notification message (optional)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label>Link (optional)</Label>
            <Input
              placeholder="/giveaways or https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Users can click the notification to navigate to this link
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  {getTypeIcon(type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{title || "Notification title"}</p>
                  {message && <p className="text-xs text-muted-foreground mt-1">{message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={isSending || !title.trim()}
            className="w-full gap-2"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSending ? "Sending..." : `Send to ${recipient === "all" ? "All Users" : "Selected User"}`}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
