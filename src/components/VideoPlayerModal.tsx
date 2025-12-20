import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  isExternal?: boolean;
}

export function VideoPlayerModal({ isOpen, onClose, videoUrl, title, isExternal }: VideoPlayerModalProps) {
  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Extract Twitch VOD ID from URL
  const extractTwitchVODId = (url: string) => {
    // Match twitch.tv/videos/VIDEO_ID pattern
    const vodMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (vodMatch) return { type: 'vod', id: vodMatch[1] };
    
    // Match twitch.tv/CHANNEL/clip/CLIP_ID pattern
    const clipMatch = url.match(/twitch\.tv\/[^\/]+\/clip\/([a-zA-Z0-9_-]+)/);
    if (clipMatch) return { type: 'clip', id: clipMatch[1] };
    
    // Match clips.twitch.tv/CLIP_ID pattern
    const clipsMatch = url.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/);
    if (clipsMatch) return { type: 'clip', id: clipsMatch[1] };
    
    return null;
  };

  // Extract Kick VOD info from URL
  const extractKickVODId = (url: string) => {
    // Match kick.com/CHANNEL?video=VIDEO_ID pattern
    const videoMatch = url.match(/kick\.com\/([^\/\?]+)\?.*video=([a-f0-9-]+)/i);
    if (videoMatch) return { channel: videoMatch[1], videoId: videoMatch[2] };
    
    // Match kick.com/video/VIDEO_ID pattern
    const videoMatch2 = url.match(/kick\.com\/video\/([a-f0-9-]+)/i);
    if (videoMatch2) return { channel: null, videoId: videoMatch2[1] };
    
    return null;
  };

  const youtubeId = extractYouTubeId(videoUrl);
  const twitchInfo = extractTwitchVODId(videoUrl);
  const kickInfo = extractKickVODId(videoUrl);
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const getEmbedUrl = () => {
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
    }
    if (twitchInfo) {
      if (twitchInfo.type === 'vod') {
        return `https://player.twitch.tv/?video=${twitchInfo.id}&parent=${hostname}&autoplay=true`;
      }
      return `https://clips.twitch.tv/embed?clip=${twitchInfo.id}&parent=${hostname}&autoplay=true`;
    }
    if (kickInfo) {
      // Kick doesn't have official VOD embed support, but we can try their player
      return `https://player.kick.com/${kickInfo.channel || 'video'}?video=${kickInfo.videoId}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();
  const isEmbeddable = !!embedUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-background border-border">
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="aspect-video w-full bg-black">
            {isExternal && isEmbeddable ? (
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full"
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          
          <div className="p-4 border-t border-border">
            <h2 className="font-semibold text-lg">{title}</h2>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}