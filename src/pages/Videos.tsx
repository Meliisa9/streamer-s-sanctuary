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

  // Featured Carousel Component - 3D Perspective Style matching screenshot
  const FeaturedCarousel = ({ videos }: { videos: Video[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
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

    const getCardStyle = (position: number): React.CSSProperties => {
      const baseTransform = {
        center: {
          transform: 'translateX(-50%) scale(1) rotateY(0deg)',
          zIndex: 30,
          opacity: 1,
          left: '50%',
        },
        left: {
          transform: 'translateX(-85%) scale(0.75) rotateY(25deg)',
          zIndex: 20,
          opacity: 0.7,
          left: '30%',
        },
        right: {
          transform: 'translateX(35%) scale(0.75) rotateY(-25deg)',
          zIndex: 20,
          opacity: 0.7,
          left: '70%',
        },
        farLeft: {
          transform: 'translateX(-120%) scale(0.55) rotateY(35deg)',
          zIndex: 10,
          opacity: 0.4,
          left: '15%',
        },
        farRight: {
          transform: 'translateX(70%) scale(0.55) rotateY(-35deg)',
          zIndex: 10,
          opacity: 0.4,
          left: '85%',
        },
      };

      switch (position) {
        case 0: return baseTransform.center;
        case -1: return baseTransform.left;
        case 1: return baseTransform.right;
        case -2: return baseTransform.farLeft;
        case 2: return baseTransform.farRight;
        default: return { opacity: 0, zIndex: 0 };
      }
    };

    return (
      <div className="relative py-8 overflow-hidden">
        {/* Purple/Blue Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/50 via-purple-900/30 to-violet-950/50 rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
        
        {/* 3D Carousel Container */}
        <div 
          className="relative h-[320px] md:h-[420px] lg:h-[480px]"
          style={{ perspective: '1500px', perspectiveOrigin: 'center center' }}
        >
          {/* Carousel Cards */}
          {[-2, -1, 0, 1, 2].map((offset) => {
            if (videos.length <= Math.abs(offset)) return null;
            const videoIndex = getVideoIndex(offset);
            const video = videos[videoIndex];
            const style = getCardStyle(offset);
            
            return (
              <motion.div
                key={`${video.id}-${offset}`}
                className="absolute top-1/2 cursor-pointer"
                initial={false}
                animate={{
                  opacity: style.opacity,
                  scale: offset === 0 ? 1 : offset === -1 || offset === 1 ? 0.75 : 0.55,
                  x: offset === 0 ? '-50%' : offset === -1 ? '-85%' : offset === 1 ? '35%' : offset === -2 ? '-120%' : '70%',
                  rotateY: offset === 0 ? 0 : offset < 0 ? 25 + Math.abs(offset) * 10 : -25 - Math.abs(offset) * 10,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                style={{
                  left: style.left as string,
                  zIndex: style.zIndex,
                  transformStyle: 'preserve-3d',
                  translateY: '-50%',
                }}
                onClick={() => offset === 0 ? handleVideoClick(video) : setCurrentIndex(videoIndex)}
              >
                {/* Card with Purple Glow Border */}
                <div 
                  className={`relative rounded-2xl overflow-hidden shadow-2xl ${
                    offset === 0 ? 'ring-4 ring-purple-500/60 shadow-purple-500/30' : ''
                  }`}
                  style={{
                    width: offset === 0 ? 'min(700px, 85vw)' : 'min(500px, 70vw)',
                    aspectRatio: '16/9',
                  }}
                >
                  {/* Video Thumbnail */}
                  <img
                    src={getThumbnail(video)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  
                  {/* Play Button on Center Card */}
                  {offset === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-primary/40">
                        <Play className="w-7 h-7 md:w-9 md:h-9 text-primary-foreground ml-1" />
                      </div>
                    </div>
                  )}
                  
                  {/* Video Info Overlay - Only on center */}
                  {offset === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {video.multiplier && (
                          <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded">
                            {video.multiplier}
                          </span>
                        )}
                        {video.duration && (
                          <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-xs rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white line-clamp-1 drop-shadow-lg">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.views?.toLocaleString() || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className={`w-4 h-4 ${isVideoLiked(video.id) ? "fill-red-500 text-red-500" : ""}`} />
                          {video.likes_count?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Side card title */}
                  {offset !== 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <h4 className="text-sm font-medium text-white/90 line-clamp-1">
                        {video.title}
                      </h4>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Large Navigation Arrows */}
        {videos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-300 group"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:text-primary transition-colors" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-300 group"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:text-primary transition-colors" />
            </button>
          </>
        )}

        {/* Carousel Dots */}
        {videos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-40">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "bg-primary w-8 shadow-lg shadow-primary/50" 
                    : "bg-white/30 hover:bg-white/50 w-2"
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