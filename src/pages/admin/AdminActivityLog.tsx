import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, User, RefreshCw, Search, Filter, Calendar, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Json } from "@/integrations/supabase/types";

interface UserActivity {
  id: string;
  user_id: string | null;
  action: string;
  details: Json;
  ip_address: string | null;
  created_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function AdminActivityLog() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "logins">("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, [filterAction, activeTab]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("user_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      // If on logins tab, filter to only login actions
      if (activeTab === "logins") {
        query = query.eq("action", "login");
      } else if (filterAction) {
        query = query.eq("action", filterAction);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles for user activities
      const userIds = [...new Set(data?.map((a) => a.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

        const activitiesWithProfiles = data?.map((activity) => ({
          ...activity,
          profile: activity.user_id ? profileMap.get(activity.user_id) : undefined,
        }));

        setActivities(activitiesWithProfiles || []);
      } else {
        setActivities(data || []);
      }
    } catch (error: any) {
      toast({ title: "Error fetching activities", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique actions excluding login when on all tab for dropdown
  const uniqueActions = [...new Set(activities.map((a) => a.action))].filter(
    action => activeTab === "logins" ? action === "login" : true
  );

  const filteredActivities = activities.filter((activity) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.action.toLowerCase().includes(searchLower) ||
      activity.profile?.username?.toLowerCase().includes(searchLower) ||
      activity.profile?.display_name?.toLowerCase().includes(searchLower) ||
      JSON.stringify(activity.details).toLowerCase().includes(searchLower)
    );
  });

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'bg-blue-500/20 text-blue-400';
    if (action.includes('signup')) return 'bg-cyan-500/20 text-cyan-400';
    if (action.includes('create') || action.includes('publish')) return 'bg-green-500/20 text-green-400';
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-500/20 text-red-400';
    if (action.includes('update') || action.includes('edit')) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-primary/20 text-primary';
  };

  // Stats calculations
  const loginActivities = activities.filter(a => a.action === 'login');
  const loginsToday = loginActivities.filter(
    a => new Date(a.created_at).toDateString() === new Date().toDateString()
  ).length;
  const uniqueLoginUsers = new Set(loginActivities.map(a => a.user_id)).size;

  const renderActivityList = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">
          {activeTab === "logins" ? "Login Activity" : "Recent Activity"}
        </h3>
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No activities found</p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-start gap-4">
                {activity.profile?.avatar_url ? (
                  <img
                    src={activity.profile.avatar_url}
                    alt="Avatar"
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {activity.profile?.display_name || activity.profile?.username || "Unknown User"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                      {activity.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  {Object.keys(activity.details || {}).length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {JSON.stringify(activity.details).slice(0, 100)}
                      {JSON.stringify(activity.details).length > 100 && "..."}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(activity.created_at), "MMM d, yyyy HH:mm")}
                    </span>
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                    {activity.ip_address && <span>IP: {activity.ip_address}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            User Activity Log
          </h2>
          <p className="text-muted-foreground">Track user actions and behavior across the platform</p>
        </div>
        <Button variant="outline" onClick={fetchActivities} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "logins")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all" className="gap-2">
            <Activity className="w-4 h-4" />
            All Activity
          </TabsTrigger>
          <TabsTrigger value="logins" className="gap-2">
            <LogIn className="w-4 h-4" />
            Login Activity
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {activeTab === "all" && (
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="">All Actions</option>
              {uniqueActions.filter(a => a !== "login").map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          )}
        </div>

        <TabsContent value="all" className="mt-4">
          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-muted-foreground text-sm">Total Activities</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-muted-foreground text-sm">Logins Today</p>
              <p className="text-2xl font-bold text-blue-400">{loginsToday}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-muted-foreground text-sm">Unique Users</p>
              <p className="text-2xl font-bold text-green-400">
                {new Set(activities.map((a) => a.user_id)).size}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-muted-foreground text-sm">Action Types</p>
              <p className="text-2xl font-bold text-purple-400">{uniqueActions.length}</p>
            </motion.div>
          </div>

          {renderActivityList()}
        </TabsContent>

        <TabsContent value="logins" className="mt-4">
          {/* Login Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-muted-foreground text-sm">Total Logins</p>
              <p className="text-2xl font-bold">{loginActivities.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-muted-foreground text-sm">Logins Today</p>
              <p className="text-2xl font-bold text-blue-400">{loginsToday}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-muted-foreground text-sm">Unique Users</p>
              <p className="text-2xl font-bold text-green-400">{uniqueLoginUsers}</p>
            </motion.div>
          </div>

          {renderActivityList()}
        </TabsContent>
      </Tabs>
    </div>
  );
}