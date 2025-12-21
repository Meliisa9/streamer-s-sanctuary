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

  // Handle OAuth return from Twitch/Kick
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check for Twitch success
    if (params.get("twitch_success") === "true") {
      const username = params.get("twitch_username");
      toast({
        title: "Twitch Connected!",
        description: `Connected as ${username || "your Twitch account"}`,
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      // Refetch data
      refetch();
    }
    
    // Check for Twitch error
    if (params.get("twitch_error")) {
      toast({
        title: "Twitch Connection Failed",
        description: params.get("twitch_error") || "Failed to connect",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
    
    // Check for Kick success
    if (params.get("kick_success") === "true") {
      const username = params.get("kick_username");
      toast({
        title: "Kick Connected!",
        description: `Connected as ${username || "your Kick account"}`,
      });
      window.history.replaceState({}, "", window.location.pathname);
      refetch();
    }
    
    // Check for Kick error
    if (params.get("kick_error")) {
      toast({
        title: "Kick Connection Failed",
        description: params.get("kick_error") || "Failed to connect",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetch]);

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
      
      if (!data.authUrl) {
        throw new Error("No authorization URL returned");
      }

      // Redirect to Twitch OAuth
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("Twitch connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Twitch",
        variant: "destructive",
      });
    }
  }, [user]);

  // Connect to Kick
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
          state: user.id,
          frontend_url: window.location.origin,
        },
      });

      if (error) throw error;
      
      // The function returns either authUrl or authorize_url
      const authUrl = data.authUrl || data.authorize_url;
      
      if (!authUrl) {
        throw new Error("No authorization URL returned");
      }

      // Redirect to Kick OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      console.error("Kick connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Kick",
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
