import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notifyFollow } from "@/hooks/useSocialNotifications";

export function useUserFollow(targetUserId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user is following target user
  const { data: isFollowing, isLoading: checkingFollow } = useQuery({
    queryKey: ["is-following", user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId || user.id === targetUserId) return false;
      const { data, error } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });

  // Get followers count for a user
  const { data: followersCount } = useQuery({
    queryKey: ["followers-count", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;
      const { count, error } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!targetUserId,
  });

  // Get following count for a user
  const { data: followingCount } = useQuery({
    queryKey: ["following-count", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;
      const { count, error } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!targetUserId,
  });

  // Get list of users the current user is following
  const { data: following } = useQuery({
    queryKey: ["user-following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_follows")
        .select(`
          following_id,
          created_at
        `)
        .eq("follower_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get list of followers
  const { data: followers } = useQuery({
    queryKey: ["user-followers", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from("user_follows")
        .select(`
          follower_id,
          created_at
        `)
        .eq("following_id", targetUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });

  const followMutation = useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("user_follows").insert({
        follower_id: user.id,
        following_id: followingId,
      });
      if (error) throw error;
      
      // Get follower's profile for notification
      const { data: followerProfile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const followerName = followerProfile?.display_name || followerProfile?.username || "Someone";
      await notifyFollow(user.id, followingId, followerName);
    },
    onSuccess: () => {
      toast({ title: "Following!" });
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      queryClient.invalidateQueries({ queryKey: ["followers-count"] });
      queryClient.invalidateQueries({ queryKey: ["following-count"] });
      queryClient.invalidateQueries({ queryKey: ["user-following"] });
      queryClient.invalidateQueries({ queryKey: ["user-followers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error following user", description: error.message, variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", followingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Unfollowed" });
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      queryClient.invalidateQueries({ queryKey: ["followers-count"] });
      queryClient.invalidateQueries({ queryKey: ["following-count"] });
      queryClient.invalidateQueries({ queryKey: ["user-following"] });
      queryClient.invalidateQueries({ queryKey: ["user-followers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error unfollowing user", description: error.message, variant: "destructive" });
    },
  });

  const toggleFollow = (targetId: string) => {
    if (!user) {
      toast({ title: "Please sign in to follow users" });
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate(targetId);
    } else {
      followMutation.mutate(targetId);
    }
  };

  return {
    isFollowing,
    checkingFollow,
    followersCount,
    followingCount,
    following,
    followers,
    toggleFollow,
    isToggling: followMutation.isPending || unfollowMutation.isPending,
  };
}
