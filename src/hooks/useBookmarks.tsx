import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ContentType = "video" | "article" | "giveaway";

export function useBookmarks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ["user-bookmarks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addBookmarkMutation = useMutation({
    mutationFn: async ({ contentType, contentId }: { contentType: ContentType; contentId: string }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("user_bookmarks").insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Bookmarked!" });
      queryClient.invalidateQueries({ queryKey: ["user-bookmarks"] });
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already bookmarked" });
      } else {
        toast({ title: "Error bookmarking", description: error.message, variant: "destructive" });
      }
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async ({ contentType, contentId }: { contentType: ContentType; contentId: string }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Bookmark removed" });
      queryClient.invalidateQueries({ queryKey: ["user-bookmarks"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error removing bookmark", description: error.message, variant: "destructive" });
    },
  });

  const isBookmarked = (contentType: ContentType, contentId: string) => {
    return bookmarks?.some((b) => b.content_type === contentType && b.content_id === contentId) || false;
  };

  const toggleBookmark = (contentType: ContentType, contentId: string) => {
    if (!user) {
      toast({ title: "Please sign in to bookmark" });
      return;
    }
    if (isBookmarked(contentType, contentId)) {
      removeBookmarkMutation.mutate({ contentType, contentId });
    } else {
      addBookmarkMutation.mutate({ contentType, contentId });
    }
  };

  const getBookmarksByType = (contentType: ContentType) => {
    return bookmarks?.filter((b) => b.content_type === contentType) || [];
  };

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    toggleBookmark,
    getBookmarksByType,
    isToggling: addBookmarkMutation.isPending || removeBookmarkMutation.isPending,
  };
}
