import { motion } from "framer-motion";
import { Play, Users, Trophy, Gift, ArrowRight, Twitch, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: Users, value: "150K+", label: "Community Members" },
  { icon: Trophy, value: "$2.5M", label: "Total Wins Streamed" },
  { icon: Gift, value: "500+", label: "Giveaways Hosted" },
];

const featuredCasinos = [
  { name: "Stake Casino", bonus: "200% up to $3000", image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400&h=200&fit=crop" },
  { name: "Roobet", bonus: "Free $5 No Deposit", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=200&fit=crop" },
  { name: "Duelbits", bonus: "100% Bonus + Rakeback", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=200&fit=crop" },
];

const upcomingStreams = [
  { title: "Bonus Hunt Sunday", date: "Sun, 8 PM CET", game: "Slots", viewers: "5.2K" },
  { title: "High Roller Session", date: "Mon, 10 PM CET", game: "Live Casino", viewers: "3.8K" },
  { title: "Community Giveaway", date: "Wed, 9 PM CET", game: "Mixed", viewers: "8.1K" },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-neon/15 rounded-full blur-[100px] animate-pulse-slow" />
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Live Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/20 border border-destructive/50 rounded-full mb-8"
            >
              <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium text-destructive">Live on Twitch</span>
              <span className="text-xs text-muted-foreground">• 12.5K viewers</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              Welcome to{" "}
              <span className="gradient-text">StreamerX</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Your premium destination for casino streaming, exclusive bonuses,
              and thrilling giveaways.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button variant="glow" size="xl" className="group">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Live Stream
              </Button>
              <Button variant="glass" size="xl" className="group">
                <Twitch className="w-5 h-5" />
                Follow on Twitch
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                className="glass rounded-2xl p-6 text-center card-hover"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold gradient-text mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Casinos */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Featured <span className="gradient-text">Bonuses</span>
              </h2>
              <p className="text-muted-foreground">Exclusive deals for our community</p>
            </div>
            <Link to="/bonuses">
              <Button variant="outline" className="group">
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCasinos.map((casino, index) => (
              <motion.div
                key={casino.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl overflow-hidden card-hover neon-border group"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={casino.image}
                    alt={casino.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{casino.name}</h3>
                  <p className="text-accent font-semibold mb-4">{casino.bonus}</p>
                  <Button variant="gold" className="w-full">
                    Claim Bonus
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Streams */}
      <section className="py-20 px-6 bg-card/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Upcoming <span className="gradient-text">Streams</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Don't miss out on our scheduled streams and special events
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {upcomingStreams.map((stream, index) => (
              <motion.div
                key={stream.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 card-hover"
              >
                <div className="flex items-center gap-2 text-sm text-primary mb-3">
                  <Clock className="w-4 h-4" />
                  {stream.date}
                </div>
                <h3 className="text-xl font-bold mb-2">{stream.title}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{stream.game}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    ~{stream.viewers}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Wins */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Latest <span className="gradient-text-gold">Wins</span>
              </h2>
              <p className="text-muted-foreground">Watch our biggest hits</p>
            </div>
            <Link to="/videos">
              <Button variant="outline" className="group">
                All Videos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl overflow-hidden card-hover group cursor-pointer"
              >
                <div className="relative aspect-video bg-secondary">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/40 transition-colors">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded text-xs">
                    12:34
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-2">
                    Crazy Max Win on Sweet Bonanza! 🎰
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-accent" />
                    <span>50,000x</span>
                    <span>•</span>
                    <span>2.5K views</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-neon/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-[100px]" />
            
            <div className="relative z-10 py-16 px-8 md:px-16 text-center">
              <Gift className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Active <span className="gradient-text-gold">Giveaway</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Win $5,000 in cash! Join now for a chance to win exclusive prizes.
              </p>
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-accent">23</p>
                  <p className="text-sm text-muted-foreground">Days</p>
                </div>
                <span className="text-2xl text-muted-foreground">:</span>
                <div className="text-center">
                  <p className="text-4xl font-bold text-accent">14</p>
                  <p className="text-sm text-muted-foreground">Hours</p>
                </div>
                <span className="text-2xl text-muted-foreground">:</span>
                <div className="text-center">
                  <p className="text-4xl font-bold text-accent">52</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </div>
              <Link to="/giveaways">
                <Button variant="gold" size="xl" className="group">
                  Enter Giveaway
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
