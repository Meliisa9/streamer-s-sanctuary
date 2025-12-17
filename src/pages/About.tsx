import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Info, Target, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AboutSettings {
  about_title: string;
  about_subtitle: string;
  about_content: string;
  about_image: string;
  about_mission_title: string;
  about_mission_content: string;
  about_team_title: string;
  about_team_content: string;
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
};

export default function About() {
  const { data: settings = defaultSettings, isLoading } = useQuery({
    queryKey: ["about-settings"],
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

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-8 md:p-12 mb-12"
        >
          <div
            className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl prose-video:rounded-xl"
            dangerouslySetInnerHTML={{ __html: settings.about_content || defaultSettings.about_content }}
          />
        </motion.div>

        {/* Mission & Team Cards */}
        <div className="grid md:grid-cols-2 gap-8">
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

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 glass rounded-3xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Be part of something special. Join thousands of members who share your passion for entertainment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/" className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
              Explore Content
            </a>
            <a href="/giveaways" className="inline-flex items-center px-6 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors">
              View Giveaways
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
