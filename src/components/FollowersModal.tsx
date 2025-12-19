import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Loader2 } from "lucide-react";
import { UserAvatarLink } from "@/components/UserAvatarLink";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: "followers" | "following";
}

interface UserProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function FollowersModal({ isOpen, onClose, userId, initialTab = "followers" }: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: followers, isLoading: loadingFollowers } = useQuery({
    queryKey: ["user-followers-list", userId],
    queryFn: async () => {
      const { data: follows, error } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", userId);
      if (error) throw error;

      if (follows.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", follows.map(f => f.follower_id));
      if (profilesError) throw profilesError;

      return profiles as UserProfile[];
    },
    enabled: isOpen,
  });

  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: ["user-following-list", userId],
    queryFn: async () => {
      const { data: follows, error } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId);
      if (error) throw error;

      if (follows.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", follows.map(f => f.following_id));
      if (profilesError) throw profilesError;

      return profiles as UserProfile[];
    },
    enabled: isOpen,
  });

  const renderUserList = (users: UserProfile[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }

    if (!users || users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No users yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {users.map((userItem) => (
          <UserAvatarLink
            key={userItem.user_id}
            userId={userItem.user_id}
            username={userItem.username}
            avatarUrl={userItem.avatar_url}
            size="lg"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {userItem.display_name || userItem.username || "Anonymous"}
              </p>
              {userItem.username && (
                <p className="text-sm text-muted-foreground truncate">@{userItem.username}</p>
              )}
            </div>
          </UserAvatarLink>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "followers" | "following")}>
          <TabsList className="w-full">
            <TabsTrigger value="followers" className="flex-1">
              Followers ({followers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              Following ({following?.length || 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="mt-4">
            {renderUserList(followers, loadingFollowers)}
          </TabsContent>
          <TabsContent value="following" className="mt-4">
            {renderUserList(following, loadingFollowing)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}