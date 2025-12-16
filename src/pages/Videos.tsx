import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Eye, Heart, Filter, Search, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Video = Tables<"videos">;
type Category = Tables<"video_categories">;

export default function Videos() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["video-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*, video_categories(name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userLikes } = useQuery({
    queryKey: ["video-likes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("video_likes")
        .select("video_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((l) => l.video_id);
    },
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      
      // Get current video to get likes_count
      const { data: currentVideo } = await supabase
        .from("videos")
        .select("likes_count")
        .eq("id", videoId)
        .single();
      
      const currentLikes = currentVideo?.likes_count || 0;
      
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", user.id);
        if (error) throw error;
        
        // Update likes count
        await supabase
          .from("videos")
          .update({ likes_count: Math.max(0, currentLikes - 1) })
          .eq("id", videoId);
      } else {
        // Like
        const { error } = await supabase
          .from("video_likes")
          .insert({ video_id: videoId, user_id: user.id });
        if (error) throw error;
        
        // Update likes count
        await supabase
          .from("videos")
          .update({ likes_count: currentLikes + 1 })
          .eq("id", videoId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["video-likes"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleLike = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in to like videos" });
      return;
    }
    const isLiked = userLikes?.includes(videoId) || false;
    likeMutation.mutate({ videoId, isLiked });
  };

  const categoryNames = ["All", ...(categories?.map((c) => c.name) || [])];

  const filteredVideos = videos?.filter((video) => {
    const categoryName = (video.video_categories as any)?.name || "";
    const matchesCategory = selectedCategory === "All" || categoryName === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredVideos = filteredVideos?.filter((v) => v.is_featured);

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const getThumbnail = (video: Video) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    const ytId = extractYouTubeId(video.video_url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    return "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&h=450&fit=crop";
  };

  const handleVideoClick = (video: Video) => {
    const isLocalVideo = video.video_file_url && !video.is_external;
    const isYouTube = extractYouTubeId(video.video_url);
    
    if (isLocalVideo) {
      setSelectedVideo(video);
    } else if (isYouTube) {
      setSelectedVideo(video);
    } else {
      window.open(video.video_url, "_blank");
    }
  };

  const getVideoUrl = (video: Video) => {
    if (video.video_file_url && !video.is_external) {
      return video.video_file_url;
    }
    return video.video_url;
  };

  const isVideoLiked = (videoId: string) => userLikes?.includes(videoId) || false;

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Videos</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Watch our biggest wins, bonus hunts, and highlights
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {categoryNames.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">Loading videos...</div>
        ) : (
          <>
            {/* Featured Video */}
            {featuredVideos && featuredVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-semibold">Featured</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredVideos.slice(0, 2).map((video) => (
                    <div
                      key={video.id}
                      onClick={() => handleVideoClick(video)}
                      className="glass rounded-2xl overflow-hidden card-hover neon-border group cursor-pointer"
                    >
                      <div className="relative aspect-video">
                        <img
                          src={getThumbnail(video)}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center">
                            <Play className="w-8 h-8 text-primary-foreground ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center gap-2 mb-2">
                            {video.multiplier && (
                              <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded">
                                {video.multiplier}
                              </span>
                            )}
                            {video.duration && (
                              <span className="px-2 py-1 bg-background/80 text-xs rounded">
                                {video.duration}
                              </span>
                            )}
                            {!video.is_external && video.video_file_url && (
                              <span className="px-2 py-1 bg-green-500/80 text-white text-xs rounded">
                                HD
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-foreground line-clamp-2">
                            {video.title}
                          </h3>
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {video.views?.toLocaleString() || 0}
                          </span>
                          <button
                            onClick={(e) => handleLike(e, video.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              isVideoLiked(video.id) ? "text-destructive" : "hover:text-destructive"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isVideoLiked(video.id) ? "fill-current" : ""}`} />
                            {video.likes_count?.toLocaleString() || 0}
                          </button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Video Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Latest Videos
              </h2>
              {filteredVideos && filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => handleVideoClick(video)}
                      className="glass rounded-2xl overflow-hidden card-hover group cursor-pointer"
                    >
                      <div className="relative aspect-video">
                        <img
                          src={getThumbnail(video)}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                            <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                          </div>
                        </div>
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded text-xs">
                            {video.duration}
                          </div>
                        )}
                        {video.multiplier && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded">
                            {video.multiplier}
                          </div>
                        )}
                        {!video.is_external && video.video_file_url && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/80 text-white text-xs rounded">
                            HD
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <span className="text-xs text-primary font-medium">
                          {(video.video_categories as any)?.name || "Uncategorized"}
                        </span>
                        <h3 className="font-semibold mt-1 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {video.views?.toLocaleString() || 0}
                            </span>
                            <button
                              onClick={(e) => handleLike(e, video.id)}
                              className={`flex items-center gap-1 transition-colors ${
                                isVideoLiked(video.id) ? "text-destructive" : "hover:text-destructive"
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isVideoLiked(video.id) ? "fill-current" : ""}`} />
                              {video.likes_count?.toLocaleString() || 0}
                            </button>
                          </div>
                          <span>{new Date(video.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  No videos found. Check back later!
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={getVideoUrl(selectedVideo)}
          title={selectedVideo.title}
          isExternal={selectedVideo.is_external ?? true}
        />
      )}
    </div>
  );
}
