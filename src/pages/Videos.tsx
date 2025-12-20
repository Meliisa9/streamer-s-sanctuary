import { useState, useRef, useCallback, useEffect } from "react";
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

  // Check if URL is a Twitch VOD/Clip
  const isTwitchUrl = (url: string) => {
    return /twitch\.tv\/(videos\/\d+|[^\/]+\/clip\/|clips\.)/.test(url);
  };

  // Check if URL is a Kick VOD
  const isKickUrl = (url: string) => {
    return /kick\.com\/.*(\?video=|\/video\/)/.test(url);
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
    const isTwitch = isTwitchUrl(video.video_url);
    const isKick = isKickUrl(video.video_url);
    
    // Open modal for YouTube, Twitch, Kick, and local videos
    if (isLocalVideo || isYouTube || isTwitch || isKick) {
      setSelectedVideo(video);
    } else {
      window.open(video.video_url, "_blank");
    }
  };

  const isVideoLiked = (videoId: string) => userLikes?.includes(videoId) || false;

  // Featured Carousel Component - Exact match to screenshot design
  const FeaturedCarousel = ({ videos }: { videos: Video[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Auto-play
    useEffect(() => {
      if (videos.length <= 1) return;
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(interval);
    }, [videos.length]);
    
    const goToPrevious = () => {
      setCurrentIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
    };
    
    const goToNext = () => {
      setCurrentIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
    };

    if (videos.length === 0) return null;

    const getVideoIndex = (offset: number) => {
      let index = currentIndex + offset;
      if (index < 0) index = videos.length + index;
      if (index >= videos.length) index = index - videos.length;
      return index;
    };

    return (
      <div className="relative py-12 px-4">
        {/* 3D Carousel Container */}
        <div 
          className="relative h-[280px] md:h-[380px] lg:h-[450px] flex items-center justify-center"
          style={{ perspective: '1200px' }}
        >
          {/* Left Side Card */}
          {videos.length > 1 && (
            <motion.div
              key={`left-${getVideoIndex(-1)}`}
              className="absolute cursor-pointer"
              initial={false}
              animate={{
                x: '-55%',
                scale: 0.75,
                rotateY: 25,
                opacity: 0.7,
                zIndex: 10,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              style={{ transformStyle: 'preserve-3d' }}
              onClick={() => setCurrentIndex(getVideoIndex(-1))}
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-black"
                style={{ width: 'min(380px, 55vw)', aspectRatio: '16/9' }}>
                <img
                  src={getThumbnail(videos[getVideoIndex(-1)])}
                  alt={videos[getVideoIndex(-1)].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
              </div>
            </motion.div>
          )}

          {/* Center Card - Main Featured */}
          <motion.div
            key={`center-${currentIndex}`}
            className="relative cursor-pointer z-30"
            initial={false}
            animate={{
              scale: 1,
              x: 0,
              rotateY: 0,
              opacity: 1,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => handleVideoClick(videos[currentIndex])}
          >
            <div 
              className="relative rounded-2xl overflow-hidden border-2 border-black"
              style={{ width: 'min(620px, 80vw)', aspectRatio: '16/9' }}
            >
              <img
                src={getThumbnail(videos[currentIndex])}
                alt={videos[currentIndex].title}
                className="w-full h-full object-cover"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </div>
              </div>
              
              {/* Video Info */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-3">
                  {videos[currentIndex].multiplier && (
                    <span className="px-3 py-1 bg-accent text-accent-foreground text-sm font-bold rounded-lg">
                      {videos[currentIndex].multiplier}
                    </span>
                  )}
                  {videos[currentIndex].duration && (
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-sm rounded-lg flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {videos[currentIndex].duration}
                    </span>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white line-clamp-2 drop-shadow-lg mb-2">
                  {videos[currentIndex].title}
                </h3>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {videos[currentIndex].views?.toLocaleString() || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className={`w-4 h-4 ${isVideoLiked(videos[currentIndex].id) ? "fill-red-500 text-red-500" : ""}`} />
                    {videos[currentIndex].likes_count?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side Card */}
          {videos.length > 1 && (
            <motion.div
              key={`right-${getVideoIndex(1)}`}
              className="absolute cursor-pointer"
              initial={false}
              animate={{
                x: '55%',
                scale: 0.75,
                rotateY: -25,
                opacity: 0.7,
                zIndex: 10,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              style={{ transformStyle: 'preserve-3d' }}
              onClick={() => setCurrentIndex(getVideoIndex(1))}
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-black"
                style={{ width: 'min(380px, 55vw)', aspectRatio: '16/9' }}>
                <img
                  src={getThumbnail(videos[getVideoIndex(1)])}
                  alt={videos[getVideoIndex(1)].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Large Navigation Arrows - Transparent with just arrows */}
        {videos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center hover:scale-110 transition-all duration-300 group"
            >
              <ChevronLeft className="w-10 h-10 md:w-12 md:h-12 text-white/80 group-hover:text-white transition-colors drop-shadow-lg" strokeWidth={2.5} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center hover:scale-110 transition-all duration-300 group"
            >
              <ChevronRight className="w-10 h-10 md:w-12 md:h-12 text-white/80 group-hover:text-white transition-colors drop-shadow-lg" strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* Carousel Dots */}
        {videos.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "bg-primary w-8" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
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
                      className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                        isVideoLiked(video.id) ? "text-red-500" : ""
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isVideoLiked(video.id) ? "fill-current" : ""}`} />
                      {video.likes_count || 0}
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
      <div className="container mx-auto space-y-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Videos</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Watch our latest wins, highlights, and exclusive content
          </p>
        </motion.div>

        {/* Featured Carousel */}
        {featuredVideos && featuredVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FeaturedCarousel videos={featuredVideos} />
          </motion.div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            {categoryNames.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Category Sections - Big Wins & Max Wins (placed after search/filter) */}
        {!isLoading && (
          <div className="space-y-10">
            <VideoSection 
              title="Big Wins" 
              icon={Flame} 
              videos={bigWinsVideos} 
              iconColor="text-orange-500" 
            />
            <VideoSection 
              title="Max Wins" 
              icon={Crown} 
              videos={maxWinsVideos} 
              iconColor="text-yellow-500" 
            />
          </div>
        )}

        {/* All Videos Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading videos...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {selectedCategory === "All" ? "Latest Videos" : selectedCategory}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos?.map((video, index) => (
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
                          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                            isVideoLiked(video.id) ? "text-red-500" : ""
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${isVideoLiked(video.id) ? "fill-current" : ""}`} />
                          {video.likes_count || 0}
                        </button>
                      </div>
                      <BookmarkButton contentType="video" contentId={video.id} size="sm" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <VideoPlayerModal
            isOpen={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
            videoUrl={selectedVideo.video_file_url || selectedVideo.video_url}
            title={selectedVideo.title}
            isExternal={!!selectedVideo.is_external}
          />
        )}
      </div>
    </div>
  );
}
