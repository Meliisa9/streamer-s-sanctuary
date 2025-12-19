import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Eye, Heart, Filter, Search, Clock, TrendingUp, Calendar, ChevronLeft, ChevronRight, Flame, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { BookmarkButton } from "@/components/BookmarkButton";
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
        .select("*, video_categories(name, slug)")
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
      
      const { data: currentVideo } = await supabase
        .from("videos")
        .select("likes_count")
        .eq("id", videoId)
        .single();
      
      const currentLikes = currentVideo?.likes_count || 0;
      
      if (isLiked) {
        const { error } = await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", user.id);
        if (error) throw error;
        
        await supabase
          .from("videos")
          .update({ likes_count: Math.max(0, currentLikes - 1) })
          .eq("id", videoId);
      } else {
        const { error } = await supabase
          .from("video_likes")
          .insert({ video_id: videoId, user_id: user.id });
        if (error) throw error;
        
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
  
  // Get videos by category slug
  const bigWinsVideos = videos?.filter((v) => {
    const slug = (v.video_categories as any)?.slug;
    return slug === "big-wins";
  });
  
  const maxWinsVideos = videos?.filter((v) => {
    const slug = (v.video_categories as any)?.slug;
    return slug === "max-wins";
  });
  
  const latestVideos = filteredVideos?.slice(0, 12);

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
    
    if (isLocalVideo || isYouTube) {
      setSelectedVideo(video);
    } else {
      window.open(video.video_url, "_blank");
    }
  };

  const isVideoLiked = (videoId: string) => userLikes?.includes(videoId) || false;

  // Featured Carousel Component - Screenshot style
  const FeaturedCarousel = ({ videos }: { videos: Video[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const goToPrevious = () => {
      setCurrentIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
    };
    
    const goToNext = () => {
      setCurrentIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
    };

    if (videos.length === 0) return null;

    const currentVideo = videos[currentIndex];

    return (
      <div className="relative group">
        {/* Main Featured Video - Full Width */}
        <div 
          className="relative aspect-[21/9] rounded-2xl overflow-hidden cursor-pointer"
          onClick={() => handleVideoClick(currentVideo)}
        >
          <img
            src={getThumbnail(currentVideo)}
            alt={currentVideo.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          
          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center p-8 md:p-12">
            <div className="max-w-2xl">
              {/* Badges */}
              <div className="flex items-center gap-3 mb-4">
                {currentVideo.is_featured && (
                  <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    FEATURED
                  </span>
                )}
                {currentVideo.multiplier && (
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    {currentVideo.multiplier}
                  </span>
                )}
                {currentVideo.duration && (
                  <span className="px-3 py-1 bg-background/80 backdrop-blur-sm text-xs rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentVideo.duration}
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight line-clamp-2">
                {currentVideo.title}
              </h2>
              
              {/* Description if available */}
              {currentVideo.description && (
                <p className="text-muted-foreground text-sm md:text-base mb-6 line-clamp-2">
                  {currentVideo.description}
                </p>
              )}
              
              {/* Stats & CTA */}
              <div className="flex items-center gap-4">
                <Button variant="glow" size="lg" className="gap-2">
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </Button>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {currentVideo.views?.toLocaleString() || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className={`w-4 h-4 ${isVideoLiked(currentVideo.id) ? "fill-destructive text-destructive" : ""}`} />
                    {currentVideo.likes_count?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Play Button Overlay */}
          <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl shadow-primary/30">
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {videos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-300 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-300 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Carousel Indicators */}
        {videos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex ? "bg-primary w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Video Grid Section Component
  const VideoSection = ({ 
    title, 
    icon: Icon, 
    videos: sectionVideos, 
    iconColor = "text-primary" 
  }: { 
    title: string; 
    icon: any; 
    videos: Video[] | undefined;
    iconColor?: string;
  }) => {
    if (!sectionVideos || sectionVideos.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sectionVideos.slice(0, 8).map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              onClick={() => handleVideoClick(video)}
              className="glass rounded-xl overflow-hidden card-hover group cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={getThumbnail(video)}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                  </div>
                </div>
                {video.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-background/90 text-xs rounded">
                    {video.duration}
                  </span>
                )}
                {video.multiplier && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold rounded">
                    {video.multiplier}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.views?.toLocaleString() || 0}
                    </span>
                    <button
                      onClick={(e) => handleLike(e, video.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        isVideoLiked(video.id) ? "text-destructive" : "hover:text-destructive"
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isVideoLiked(video.id) ? "fill-current" : ""}`} />
                      {video.likes_count?.toLocaleString() || 0}
                    </button>
                  </div>
                  <BookmarkButton contentType="video" contentId={video.id} size="sm" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
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
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-8"
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
          <div className="space-y-12">
            {/* Featured Video Carousel */}
            {featuredVideos && featuredVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <FeaturedCarousel videos={featuredVideos} />
              </motion.div>
            )}

            {/* Big Wins Section */}
            <VideoSection 
              title="Big Wins" 
              icon={Flame} 
              videos={bigWinsVideos} 
              iconColor="text-orange-500"
            />

            {/* Max Wins Section */}
            <VideoSection 
              title="Max Wins" 
              icon={Crown} 
              videos={maxWinsVideos} 
              iconColor="text-yellow-500"
            />

            {/* Latest Videos Section */}
            <VideoSection 
              title="Latest Videos" 
              icon={Clock} 
              videos={latestVideos} 
              iconColor="text-primary"
            />

            {/* Show message if no videos */}
            {(!filteredVideos || filteredVideos.length === 0) && (
              <div className="text-center py-20 text-muted-foreground">
                No videos found matching your criteria.
              </div>
            )}
          </div>
        )}

        {selectedVideo && (
          <VideoPlayerModal
            isOpen={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
            videoUrl={selectedVideo.video_file_url || selectedVideo.video_url}
            title={selectedVideo.title}
            isExternal={selectedVideo.is_external ?? true}
          />
        )}
      </div>
    </div>
  );
}