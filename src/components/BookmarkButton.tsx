import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/hooks/useBookmarks";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  contentType: "video" | "article" | "giveaway";
  contentId: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export function BookmarkButton({ contentType, contentId, className, size = "icon" }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, isToggling } = useBookmarks();
  const bookmarked = isBookmarked(contentType, contentId);

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(contentType, contentId);
      }}
      disabled={isToggling}
      className={cn(
        "transition-colors",
        bookmarked && "text-primary",
        className
      )}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
    </Button>
  );
}
