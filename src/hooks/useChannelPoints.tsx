import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ChannelPointsData {
  site: number;
  twitch: number;
  kick: number;
}

export interface ChannelConnection {
  platform: "twitch" | "kick";
  username: string | null;
  connected: boolean;
  lastSynced: string | null;
}

export function useChannelPoints() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all points
  const { data: pointsData, isLoading, refetch } = useQuery({
    queryKey: ["channel-points", user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          points: { site: 0, twitch: 0, kick: 0 },
          connections: [],
        };
      }

      const { data, error } = await supabase.functions.invoke("channel-points-sync", {
        body: { action: "get_all_points" },
      });

      if (error) throw error;
      return data as {
        points: ChannelPointsData;
        connections: ChannelConnection[];
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Setup realtime subscription for point updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("channel-points-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_channel_points",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (platform: "twitch" | "kick") => {
      const { data, error } = await supabase.functions.invoke("channel-points-sync", {
        body: { action: "sync", platform },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["channel-points"] });
      toast({
        title: "Points Synced",
        description: `Your ${data.platform} points have been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connect to Twitch
  const connectTwitch = useCallback(async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to connect your Twitch account.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("twitch-channel-points", {
        body: { 
          action: "authorize", 
          state: user.id,
        },
      });

      if (error) throw error;

      // Redirect to Twitch OAuth
      window.location.href = data.authUrl;
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user]);

  // Connect to Kick (using existing kick-oauth function)
  const connectKick = useCallback(async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to connect your Kick account.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("kick-oauth", {
        body: { 
          action: "authorize", 
          redirect_uri: `${window.location.origin}/auth/kick/callback`,
          state: user.id,
        },
      });

      if (error) throw error;

      // Redirect to Kick OAuth
      window.location.href = data.auth_url;
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user]);

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (platform: "twitch" | "kick") => {
      const { data, error } = await supabase.functions.invoke("channel-points-sync", {
        body: { action: "disconnect", platform },
      });

      if (error) throw error;
      return { platform };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["channel-points"] });
      toast({
        title: "Disconnected",
        description: `Your ${data.platform} account has been disconnected.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const points = pointsData?.points || { site: profile?.points || 0, twitch: 0, kick: 0 };
  const connections = pointsData?.connections || [];

  const getTotalPoints = useCallback(() => {
    return points.site + points.twitch + points.kick;
  }, [points]);

  const getConnection = useCallback((platform: "twitch" | "kick") => {
    return connections.find(c => c.platform === platform);
  }, [connections]);

  const isConnected = useCallback((platform: "twitch" | "kick") => {
    return connections.some(c => c.platform === platform && c.connected);
  }, [connections]);

  return {
    points,
    connections,
    isLoading,
    getTotalPoints,
    getConnection,
    isConnected,
    syncPoints: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    connectTwitch,
    connectKick,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    refetch,
  };
}
