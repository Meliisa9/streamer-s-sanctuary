import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, addMonths, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";
import { 
  Trophy, Calendar, Clock, Play, Square, Users, Star, 
  Plus, Trash2, RefreshCw, Award, TrendingUp, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type LeaderboardPeriod = Tables<"leaderboard_periods">;

export default function AdminLeaderboard() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPeriodType, setNewPeriodType] = useState<"weekly" | "monthly" | "all_time">("weekly");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Fetch all periods
  const { data: periods, isLoading } = useQuery({
    queryKey: ["admin-leaderboard-periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_periods")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LeaderboardPeriod[];
    },
  });

  // Fetch leaderboard stats
  const { data: stats } = useQuery({
    queryKey: ["admin-leaderboard-stats"],
    queryFn: async () => {
      const [profilesRes, snapshotsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("leaderboard_snapshots").select("id", { count: "exact" }),
      ]);
      return {
        totalPlayers: profilesRes.count || 0,
        totalSnapshots: snapshotsRes.count || 0,
      };
    },
  });

  // Create period mutation
  const createPeriod = useMutation({
    mutationFn: async ({ type, startDate, endDate }: { type: string; startDate: Date; endDate: Date }) => {
      const { error } = await supabase.from("leaderboard_periods").insert({
        period_type: type,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leaderboard-periods"] });
      setIsCreateOpen(false);
      toast({ title: "Period created", description: "New leaderboard period has been created" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Toggle active mutation
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive, periodType }: { id: string; isActive: boolean; periodType: string }) => {
      // If activating, first deactivate all other periods of the same type
      if (isActive) {
        await supabase
          .from("leaderboard_periods")
          .update({ is_active: false })
          .eq("period_type", periodType);
      }
      
      const { error } = await supabase
        .from("leaderboard_periods")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-leaderboard-periods"] });
      toast({ 
        title: isActive ? "Period started" : "Period ended",
        description: isActive ? "Leaderboard period is now active" : "Leaderboard period has ended"
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete period mutation
  const deletePeriod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leaderboard_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leaderboard-periods"] });
      toast({ title: "Period deleted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleQuickCreate = (type: "weekly" | "monthly") => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (type === "weekly") {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    createPeriod.mutate({ type, startDate, endDate });
  };

  const handleCustomCreate = () => {
    if (!customStartDate || !customEndDate) {
      toast({ title: "Error", description: "Please select start and end dates", variant: "destructive" });
      return;
    }
    createPeriod.mutate({
      type: newPeriodType,
      startDate: new Date(customStartDate),
      endDate: new Date(customEndDate),
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "weekly": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "monthly": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "all_time": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "weekly": return Clock;
      case "monthly": return Calendar;
      case "all_time": return Trophy;
      default: return Trophy;
    }
  };

  const activePeriods = periods?.filter(p => p.is_active) || [];
  const inactivePeriods = periods?.filter(p => !p.is_active) || [];

  if (isLoading) return <AdminLoadingState />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leaderboard Management"
        description="Create and manage leaderboard competition periods"
        icon={Trophy}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePeriods.length}</p>
                <p className="text-xs text-muted-foreground">Active Periods</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <History className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{periods?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Periods</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalPlayers || 0}</p>
                <p className="text-xs text-muted-foreground">Total Players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalSnapshots || 0}</p>
                <p className="text-xs text-muted-foreground">Rank Snapshots</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Create Period
          </CardTitle>
          <CardDescription>Start a new competition period with one click</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => handleQuickCreate("weekly")}
              disabled={createPeriod.isPending}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              This Week
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickCreate("monthly")}
              disabled={createPeriod.isPending}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              This Month
            </Button>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Custom Period
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Period</DialogTitle>
                  <DialogDescription>
                    Set up a custom leaderboard competition period
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Period Type</Label>
                    <Select value={newPeriodType} onValueChange={(v) => setNewPeriodType(v as typeof newPeriodType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="all_time">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCustomCreate} disabled={createPeriod.isPending}>
                    Create Period
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Active Periods */}
      {activePeriods.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Active Periods
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePeriods.map((period) => {
              const TypeIcon = getTypeIcon(period.period_type);
              return (
                <Card key={period.id} className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <TypeIcon className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <Badge className={cn("mb-1", getTypeColor(period.period_type))}>
                            {period.period_type.replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(period.start_date), "MMM d")} - {format(new Date(period.end_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => toggleActive.mutate({ id: period.id, isActive: false, periodType: period.period_type })}
                        disabled={toggleActive.isPending}
                      >
                        <Square className="w-3 h-3" />
                        End Period
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Periods */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5" />
          All Periods
        </h2>

        {periods?.length === 0 ? (
          <AdminEmptyState
            icon={Trophy}
            title="No Periods Created"
            description="Create your first leaderboard period to start tracking rankings"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periods?.map((period) => {
              const TypeIcon = getTypeIcon(period.period_type);
              const isActive = period.is_active;
              return (
                <Card key={period.id} className={cn(isActive && "border-green-500/30")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          isActive ? "bg-green-500/20" : "bg-muted"
                        )}>
                          <TypeIcon className={cn("w-5 h-5", isActive ? "text-green-500" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <Badge className={cn("mb-1", getTypeColor(period.period_type))}>
                            {period.period_type.replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(period.start_date), "MMM d")} - {format(new Date(period.end_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      {isActive && <Badge variant="default" className="bg-green-500">Active</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={isActive ? "outline" : "default"}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => toggleActive.mutate({ id: period.id, isActive: !isActive, periodType: period.period_type })}
                        disabled={toggleActive.isPending}
                      >
                        {isActive ? (
                          <>
                            <Square className="w-3 h-3" />
                            End
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Start
                          </>
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Period?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this leaderboard period and all associated snapshots.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePeriod.mutate(period.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
