import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Video, FileText, Gift, User, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  type: "video" | "article" | "giveaway" | "user";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  image?: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const searchResults: SearchResult[] = [];
      const searchLower = debouncedQuery.toLowerCase();

      // Search videos
      const { data: videos } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url")
        .eq("is_published", true)
        .ilike("title", `%${debouncedQuery}%`)
        .limit(5);

      videos?.forEach((v) => {
        searchResults.push({
          type: "video",
          id: v.id,
          title: v.title,
          url: `/videos`,
          image: v.thumbnail_url || undefined,
        });
      });

      // Search articles
      const { data: articles } = await supabase
        .from("news_articles")
        .select("id, title, slug, category, image_url")
        .eq("is_published", true)
        .ilike("title", `%${debouncedQuery}%`)
        .limit(5);

      articles?.forEach((a) => {
        searchResults.push({
          type: "article",
          id: a.id,
          title: a.title,
          subtitle: a.category || undefined,
          url: `/news/${a.slug}`,
          image: a.image_url || undefined,
        });
      });

      // Search giveaways
      const { data: giveaways } = await supabase
        .from("giveaways")
        .select("id, title, prize, image_url")
        .ilike("title", `%${debouncedQuery}%`)
        .limit(5);

      giveaways?.forEach((g) => {
        searchResults.push({
          type: "giveaway",
          id: g.id,
          title: g.title,
          subtitle: g.prize,
          url: `/giveaways`,
          image: g.image_url || undefined,
        });
      });

      // Search users
      const { data: users } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .or(`username.ilike.%${debouncedQuery}%,display_name.ilike.%${debouncedQuery}%`)
        .limit(5);

      users?.forEach((u) => {
        searchResults.push({
          type: "user",
          id: u.user_id,
          title: u.display_name || u.username || "Anonymous",
          subtitle: u.username ? `@${u.username}` : undefined,
          url: `/user/${u.username || u.user_id}`,
          image: u.avatar_url || undefined,
        });
      });

      return searchResults;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "article":
        return <FileText className="w-4 h-4" />;
      case "giveaway":
        return <Gift className="w-4 h-4" />;
      case "user":
        return <User className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      video: "bg-red-500/20 text-red-500",
      article: "bg-blue-500/20 text-blue-500",
      giveaway: "bg-green-500/20 text-green-500",
      user: "bg-purple-500/20 text-purple-500",
    };
    return colors[type] || "bg-secondary";
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            {isLoading ? (
              <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            ) : results && results.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    to={result.url}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                      {result.image ? (
                        <img src={result.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getIcon(result.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`${getTypeBadge(result.type)} text-xs capitalize`}>
                      {result.type}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
