import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}

interface UserSuggestion {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Write something...",
  rows = 3,
  maxLength = 500,
  className = "",
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useQuery<UserSuggestion[]>({
    queryKey: ["mention-users", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 1) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(5);
      if (error) return [];
      return data || [];
    },
    enabled: showSuggestions && searchTerm.length >= 1,
  });

  const getMentionContext = useCallback((text: string, pos: number) => {
    const beforeCursor = text.slice(0, pos);
    const match = beforeCursor.match(/@(\w*)$/);
    return match ? { start: beforeCursor.length - match[0].length, term: match[1] } : null;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart;
    setCursorPosition(pos);
    onChange(newValue);

    const mentionContext = getMentionContext(newValue, pos);
    if (mentionContext) {
      setSearchTerm(mentionContext.term);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setSearchTerm("");
    }
  };

  const insertMention = (user: UserSuggestion) => {
    const mentionContext = getMentionContext(value, cursorPosition);
    if (!mentionContext) return;

    const username = user.username || user.display_name || "user";
    const before = value.slice(0, mentionContext.start);
    const after = value.slice(cursorPosition);
    const newValue = `${before}@${username} ${after}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setSearchTerm("");

    // Focus back and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = mentionContext.start + username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || users.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % users.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insertMention(users[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={className}
      />
      
      <AnimatePresence>
        {showSuggestions && users.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {users.map((user, index) => (
              <button
                key={user.user_id}
                onClick={() => insertMention(user)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  index === selectedIndex ? "bg-primary/10" : "hover:bg-secondary"
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user.display_name || user.username || "Unknown User"}
                  </p>
                  {user.username && (
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <p className="text-xs text-muted-foreground mt-1">
        Type @ to mention users
      </p>
    </div>
  );
}

// Utility to parse mentions from text and render them as links
export function parseMentions(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the mention as a link
    const username = match[1];
    parts.push(
      <a
        key={`mention-${match.index}`}
        href={`/user/${username}`}
        className="text-primary hover:underline font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}
