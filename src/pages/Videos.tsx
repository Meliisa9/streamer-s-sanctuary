import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Eye, Heart, Filter, Search, Star, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = ["All", "Max Wins", "Big Wins", "Highlights", "Bonus Hunts", "Live Casino"];

const videos = [
  {
    id: 1,
    title: "INSANE 50,000x MAX WIN on Sweet Bonanza!",
    thumbnail: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&h=450&fit=crop",
    duration: "15:42",
    views: "125K",
    likes: "8.2K",
    multiplier: "50,000x",
    category: "Max Wins",
    date: "2 days ago",
    featured: true,
  },
  {
    id: 2,
    title: "Gates of Olympus Bonus Hunt - EPIC Session!",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop",
    duration: "45:20",
    views: "89K",
    likes: "5.4K",
    multiplier: "10,000x",
    category: "Bonus Hunts",
    date: "3 days ago",
    featured: false,
  },
  {
    id: 3,
    title: "Crazy Time MEGA WIN - $50,000 Hit!",
    thumbnail: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800&h=450&fit=crop",
    duration: "08:15",
    views: "234K",
    likes: "15K",
    multiplier: "500x",
    category: "Live Casino",
    date: "1 week ago",
    featured: true,
  },
  {
    id: 4,
    title: "Weekly Highlights - Best Wins Compilation",
    thumbnail: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&h=450&fit=crop",
    duration: "25:00",
    views: "156K",
    likes: "9.8K",
    multiplier: "Various",
    category: "Highlights",
    date: "5 days ago",
    featured: false,
  },
  {
    id: 5,
    title: "Fruit Party 2 - Back to Back Big Wins!",
    thumbnail: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&h=450&fit=crop",
    duration: "12:30",
    views: "67K",
    likes: "4.1K",
    multiplier: "5,000x",
    category: "Big Wins",
    date: "1 week ago",
    featured: false,
  },
  {
    id: 6,
    title: "Sugar Rush 1000 - NEW SLOT REVIEW",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop",
    duration: "18:45",
    views: "98K",
    likes: "6.2K",
    multiplier: "15,000x",
    category: "Highlights",
    date: "4 days ago",
    featured: false,
  },
];

export default function Videos() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = videos.filter((video) => {
    const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          {categories.map((category) => (
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

        {/* Featured Video */}
        {filteredVideos.some((v) => v.featured) && (
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
              {filteredVideos
                .filter((v) => v.featured)
                .slice(0, 2)
                .map((video, index) => (
                  <div
                    key={video.id}
                    className="glass rounded-2xl overflow-hidden card-hover neon-border group cursor-pointer"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={video.thumbnail}
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
                          <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded">
                            {video.multiplier}
                          </span>
                          <span className="px-2 py-1 bg-background/80 text-xs rounded">
                            {video.duration}
                          </span>
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
                          {video.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {video.likes}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{video.date}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass rounded-2xl overflow-hidden card-hover group cursor-pointer"
              >
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded text-xs">
                    {video.duration}
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded">
                    {video.multiplier}
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-primary font-medium">{video.category}</span>
                  <h3 className="font-semibold mt-1 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {video.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {video.likes}
                      </span>
                    </div>
                    <span>{video.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center mt-12"
        >
          <Button variant="outline" size="lg">
            Load More Videos
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
