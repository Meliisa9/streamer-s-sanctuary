import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Video, Newspaper, Gift, Calendar, Users, BarChart3, 
  Radio, Settings, Bell, Trophy, Shield, Zap, 
  PlusCircle, Play, Send, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface QuickAction {
  icon: any;
  label: string;
  description: string;
  href?: string;
  action?: () => Promise<void>;
  color: string;
  badge?: string;
  adminOnly?: boolean;
}

export function QuickActionsWidget() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if stream is live
  const { data: isLive } = useQuery({
    queryKey: ["stream-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "is_live")
        .single();
      return data?.value === true;
    },
  });

  // Toggle live status
  const toggleLive = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "is_live", value: !isLive }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stream-status"] });
      toast({ title: isLive ? "Stream marked offline" : "Stream marked live!" });
    },
  });

  const actions: QuickAction[] = [
    { 
      icon: Video, 
      label: "New Video", 
      description: "Upload content", 
      href: "/admin/videos", 
      color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" 
    },
    { 
      icon: Newspaper, 
      label: "Write Article", 
      description: "Create news", 
      href: "/admin/news", 
      color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" 
    },
    { 
      icon: Gift, 
      label: "New Giveaway", 
      description: "Start giveaway", 
      href: "/admin/giveaways", 
      color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" 
    },
    { 
      icon: Calendar, 
      label: "Add Event", 
      description: "Schedule", 
      href: "/admin/events", 
      color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" 
    },
    { 
      icon: isLive ? Radio : Play, 
      label: isLive ? "Go Offline" : "Go Live", 
      description: isLive ? "End stream" : "Start stream", 
      action: () => toggleLive.mutateAsync(), 
      color: isLive ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
      badge: isLive ? "LIVE" : undefined
    },
    { 
      icon: Bell, 
      label: "Notify Users", 
      description: "Send alert", 
      href: "/admin/settings/notifications", 
      color: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
      adminOnly: true 
    },
    { 
      icon: Trophy, 
      label: "New Bonus", 
      description: "Add casino", 
      href: "/admin/bonuses", 
      color: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20" 
    },
    { 
      icon: Users, 
      label: "Manage Users", 
      description: "View users", 
      href: "/admin/users", 
      color: "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20",
      adminOnly: true 
    },
  ];

  const filteredActions = actions.filter((action) => !action.adminOnly || isAdmin);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Common tasks at your fingertips</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          const content = (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.03 }}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all cursor-pointer ${action.color}`}
            >
              {action.badge && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 animate-pulse">
                  {action.badge}
                </Badge>
              )}
              <div className="p-2 rounded-lg bg-background/50">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-[10px] opacity-70">{action.description}</p>
              </div>
            </motion.div>
          );

          if (action.href) {
            return (
              <Link key={action.label} to={action.href}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.label}
              onClick={() => action.action?.()}
              disabled={toggleLive.isPending}
              className="w-full"
            >
              {content}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
