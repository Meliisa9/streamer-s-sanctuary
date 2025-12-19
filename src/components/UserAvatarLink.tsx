import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { ReactNode } from "react";

interface UserAvatarLinkProps {
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-6 h-6",
};

export function UserAvatarLink({
  userId,
  username,
  avatarUrl,
  displayName,
  size = "md",
  showName = false,
  className = "",
  children,
  onClick,
}: UserAvatarLinkProps) {
  const { user } = useAuth();

  // Determine the link destination
  const isOwnProfile = user?.id === userId;
  const linkTo = isOwnProfile ? "/profile" : username ? `/user/${username}` : "#";

  const handleClick = () => {
    onClick?.();
  };

  // If children are provided, render them with the link
  if (children) {
    return (
      <Link to={linkTo} onClick={handleClick} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link
      to={linkTo}
      onClick={handleClick}
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      <Avatar className={`${sizeClasses[size]} hover:ring-2 hover:ring-primary transition-all cursor-pointer`}>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>
          <User className={iconSizes[size]} />
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="font-medium truncate hover:text-primary transition-colors">
          {displayName || username || "Anonymous"}
        </span>
      )}
    </Link>
  );
}

// Simple wrapper for image avatars (non-Avatar component)
export function UserImageLink({
  userId,
  username,
  avatarUrl,
  className = "",
  imgClassName = "",
  fallbackClassName = "",
  onClick,
  children,
}: {
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;
  const linkTo = isOwnProfile ? "/profile" : username ? `/user/${username}` : "#";

  if (children) {
    return (
      <Link to={linkTo} onClick={onClick} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link to={linkTo} onClick={onClick} className={className}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={imgClassName} />
      ) : (
        <div className={fallbackClassName}>
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </Link>
  );
}
