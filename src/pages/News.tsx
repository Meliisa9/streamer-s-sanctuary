import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MessageCircle, User, Clock, Search, Tag, ArrowRight, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = ["All", "Updates", "Giveaways", "Tutorials", "Reviews", "Community"];

const newsArticles = [
  {
    id: 1,
    title: "New Partnership Announcement: StreamerX x Stake Casino",
    excerpt: "We're excited to announce our official partnership with Stake Casino, bringing exclusive bonuses and giveaways to our community!",
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&h=400&fit=crop",
    author: "StreamerX",
    date: "Dec 15, 2024",
    readTime: "3 min read",
    category: "Updates",
    featured: true,
    comments: 45,
    likes: 234,
  },
  {
    id: 2,
    title: "December Mega Giveaway - $10,000 Cash Prize Pool!",
    excerpt: "Our biggest giveaway yet! Enter now for a chance to win from our $10,000 prize pool. Multiple winners will be selected.",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
    author: "StreamerX",
    date: "Dec 14, 2024",
    readTime: "2 min read",
    category: "Giveaways",
    featured: true,
    comments: 128,
    likes: 567,
  },
  {
    id: 3,
    title: "How to Maximize Your Casino Bonuses - Complete Guide",
    excerpt: "Learn the best strategies to make the most of welcome bonuses, free spins, and cashback offers from our partner casinos.",
    image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800&h=400&fit=crop",
    author: "StreamerX",
    date: "Dec 12, 2024",
    readTime: "8 min read",
    category: "Tutorials",
    featured: false,
    comments: 32,
    likes: 189,
  },
  {
    id: 4,
    title: "Sweet Bonanza 1000 Review - Is It Worth the Hype?",
    excerpt: "Our in-depth review of Pragmatic Play's latest release. We test the volatility, RTP, and potential max wins.",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&h=400&fit=crop",
    author: "StreamerX",
    date: "Dec 10, 2024",
    readTime: "6 min read",
    category: "Reviews",
    featured: false,
    comments: 56,
    likes: 145,
  },
  {
    id: 5,
    title: "Community Spotlight: Top GTW Winners of November",
    excerpt: "Congratulations to our Guess The Win champions! See who made it to the top of the leaderboard last month.",
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&h=400&fit=crop",
    author: "StreamerX",
    date: "Dec 8, 2024",
    readTime: "4 min read",
    category: "Community",
    featured: false,
    comments: 23,
    likes: 98,
  },
];

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = newsArticles.filter((article) => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);

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
            Latest <span className="gradient-text">News</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with announcements, guides, and community highlights
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
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

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-accent" />
              Featured
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="glass rounded-2xl overflow-hidden card-hover neon-border group cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      {article.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {article.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {article.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {article.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {article.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Regular Articles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Posts
          </h2>
          <div className="space-y-6">
            {regularArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass rounded-2xl overflow-hidden card-hover group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-secondary text-xs font-medium rounded-full">
                        {article.category}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {article.author}
                        </span>
                        <span>{article.date}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="group/btn">
                        Read More
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
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
            Load More Articles
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
