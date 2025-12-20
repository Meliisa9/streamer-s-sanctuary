import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Info, Target, Users, Loader2, Heart, Star, ExternalLink, Clock, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  socials: { platform: string; url: string }[];
}

interface Stat {
  id: string;
  label: string;
  value: string;
  icon: string;
}

interface AboutSettings {
  about_title: string;
  about_subtitle: string;
  about_content: string;
  about_image: string;
  about_mission_title: string;
  about_mission_content: string;
  about_team_title: string;
  about_team_content: string;
  about_values_title: string;
  about_values: string[];
  about_stats: Stat[];
  about_team_members: TeamMember[];
  about_cta_title: string;
  about_cta_text: string;
  about_cta_button: string;
  about_cta_link: string;
}

const defaultSettings: AboutSettings = {
  about_title: "About Us",
  about_subtitle: "Your trusted destination for casino streaming entertainment",
  about_content: "<p>Welcome to our community! We are passionate about creating entertaining and transparent casino streaming content. Our mission is to bring you the most exciting gambling experiences while promoting responsible gaming.</p><p>Founded by dedicated streamers and casino enthusiasts, we've built a community of like-minded individuals who share our love for the thrill of the game. Whether you're here to watch big wins, learn strategies, or simply enjoy the entertainment, you're in the right place.</p>",
  about_image: "",
  about_mission_title: "Our Mission",
  about_mission_content: "To provide the most entertaining and transparent casino streaming experience while promoting responsible gambling practices. We believe in building a community based on trust, excitement, and shared experiences.",
  about_team_title: "The Team",
  about_team_content: "Our team consists of passionate streamers, community managers, and content creators who work tirelessly to bring you the best entertainment. We're committed to transparency and always put our community first.",
  about_values_title: "Our Values",
  about_values: ["Transparency", "Entertainment", "Community", "Responsibility"],
  about_stats: [
    { id: "1", label: "Active Viewers", value: "10K+", icon: "users" },
    { id: "2", label: "Stream Hours", value: "5000+", icon: "clock" },
    { id: "3", label: "Giveaways Done", value: "500+", icon: "gift" },
  ],
  about_team_members: [],
  about_cta_title: "Join Our Community",
  about_cta_text: "Be part of the action! Follow us on Twitch and join our Discord.",
  about_cta_button: "Join Discord",
  about_cta_link: "#",
};

const getStatIcon = (iconName: string) => {
  switch (iconName) {
    case "users": return <Users className="w-6 h-6" />;
    case "clock": return <Clock className="w-6 h-6" />;
    case "gift": return <Gift className="w-6 h-6" />;
    case "star": return <Star className="w-6 h-6" />;
    case "heart": return <Heart className="w-6 h-6" />;
    default: return <Star className="w-6 h-6" />;
  }
};

export default function About() {
  const { data: settings = defaultSettings, isLoading } = useQuery({
    queryKey: ["about-page-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedSettings: AboutSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof AboutSettings;
        if (key in loadedSettings) {
          (loadedSettings as Record<string, any>)[key] = row.value ?? defaultSettings[key];
        }
      });

      return loadedSettings;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Info className="w-4 h-4" />
            Learn More About Us
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            {settings.about_title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {settings.about_subtitle}
          </p>
        </motion.div>

        {/* Hero Image */}
        {settings.about_image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <img
              src={settings.about_image}
              alt="About us"
              className="w-full h-auto max-h-[400px] object-cover rounded-3xl shadow-2xl"
            />
          </motion.div>
        )}

        {/* Stats Section */}
        {settings.about_stats && settings.about_stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {settings.about_stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  {getStatIcon(stat.icon)}
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Main Content */}
        {settings.about_content && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-8 md:p-12 mb-12"
          >
            <div
              className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl prose-video:rounded-xl"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.about_content || defaultSettings.about_content) }}
            />
          </motion.div>
        )}

        {/* Values Section */}
        {settings.about_values && settings.about_values.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-center mb-6">{settings.about_values_title}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {settings.about_values.map((value, index) => (
                <Badge key={index} variant="secondary" className="px-4 py-2 text-base">
                  <Heart className="w-4 h-4 mr-2 text-primary" />
                  {value}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mission & Team Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">{settings.about_mission_title}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {settings.about_mission_content}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl font-bold">{settings.about_team_title}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {settings.about_team_content}
            </p>
          </motion.div>
        </div>

        {/* Team Members */}
        {settings.about_team_members && settings.about_team_members.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Meet the Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settings.about_team_members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="glass rounded-2xl p-6 text-center"
                >
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-secondary flex items-center justify-center">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <h3 className="text-lg font-bold">{member.name}</h3>
                  <p className="text-primary text-sm mb-2">{member.role}</p>
                  {member.bio && (
                    <p className="text-muted-foreground text-sm">{member.bio}</p>
                  )}
                  {member.socials && member.socials.length > 0 && (
                    <div className="flex justify-center gap-2 mt-3">
                      {member.socials.map((social, i) => (
                        <a
                          key={i}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-secondary hover:bg-primary/20 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center glass rounded-3xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">{settings.about_cta_title}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {settings.about_cta_text}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {settings.about_cta_link && settings.about_cta_button && (
              <Button variant="glow" asChild>
                <a href={settings.about_cta_link} target="_blank" rel="noopener noreferrer">
                  {settings.about_cta_button}
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href="/">Explore Content</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="/giveaways">View Giveaways</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
