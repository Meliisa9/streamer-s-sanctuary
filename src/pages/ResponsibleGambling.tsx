import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Heart, Phone, Clock, DollarSign, HelpCircle, ChevronRight, ExternalLink, ShieldAlert, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { icon: DollarSign, label: "Set Limits", id: "set-limits" },
  { icon: AlertTriangle, label: "Warning Signs", id: "warning-signs" },
  { icon: HelpCircle, label: "Get Help", id: "get-help" },
  { icon: Users, label: "Age Restriction", id: "age-restriction" },
];

const helpResources = [
  { 
    name: "Gamblers Anonymous", 
    url: "https://www.gamblersanonymous.org", 
    description: "Worldwide fellowship of people who share their experience",
    region: "Worldwide"
  },
  { 
    name: "National Problem Gambling Helpline", 
    url: "tel:1-800-522-4700", 
    description: "24/7 confidential helpline",
    region: "USA"
  },
  { 
    name: "GamCare", 
    url: "https://www.gamcare.org.uk", 
    description: "Free information, support and counselling",
    region: "UK"
  },
  { 
    name: "BeGambleAware", 
    url: "https://www.begambleaware.org", 
    description: "Advice and support for gambling problems",
    region: "UK"
  },
];

export default function ResponsibleGambling() {
  const location = useLocation();
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const { data: content, isLoading } = useQuery({
    queryKey: ["legal-gambling"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "legal_responsible_gambling")
        .maybeSingle();
      if (error) throw error;
      return data?.value as string | null;
    },
  });

  // Handle anchor scrolling after content loads
  useEffect(() => {
    if (!isLoading && location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const element = sectionRefs.current[id] || document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [isLoading, location.hash]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    // Try refs first, then fall back to getElementById for content loaded via dangerouslySetInnerHTML
    const element = sectionRefs.current[id] || document.getElementById(id) || document.querySelector(`[id="${id}"]`);
    
    // If still not found, try to find by text content in headings
    if (!element) {
      const headings = document.querySelectorAll('h2, h3');
      for (const heading of headings) {
        if (heading.textContent?.toLowerCase().includes(id.replace(/-/g, ' '))) {
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", `#${id}`);
          return;
        }
      }
    }
    
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500/20 via-amber-500/10 to-transparent p-8 md:p-12"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Responsible Gambling</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Your wellbeing matters. Gambling should be entertaining, not harmful. Learn to recognize warning signs and find support when needed.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="relative mt-8 flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleAnchorClick(e, link.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all group cursor-pointer"
            >
              <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
              <span className="text-sm font-medium">{link.label}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Important Warning */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-6 rounded-xl bg-red-500/10 border-2 border-red-500/30"
      >
        <div className="flex items-start gap-4">
          <ShieldAlert className="w-8 h-8 text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg text-red-200">Entertainment Only</h3>
            <p className="text-muted-foreground mt-2">
              This platform showcases gambling entertainment but does not operate a casino or accept bets. 
              The content shown on streams represents rare outcomes and is not typical of regular gambling results. 
              If you choose to gamble, please do so responsibly and only with money you can afford to lose.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <div className="p-5 rounded-xl glass border border-border/50">
          <Clock className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">Set Time Limits</h3>
          <p className="text-sm text-muted-foreground">
            Decide how long you'll play before you start and stick to it. Take regular breaks.
          </p>
        </div>
        <div className="p-5 rounded-xl glass border border-border/50">
          <DollarSign className="w-8 h-8 text-green-400 mb-3" />
          <h3 className="font-semibold mb-2">Set Budget Limits</h3>
          <p className="text-sm text-muted-foreground">
            Only gamble with money you can afford to lose. Never chase your losses.
          </p>
        </div>
        <div className="p-5 rounded-xl glass border border-border/50">
          <Heart className="w-8 h-8 text-red-400 mb-3" />
          <h3 className="font-semibold mb-2">Know When to Stop</h3>
          <p className="text-sm text-muted-foreground">
            If gambling stops being fun, stop gambling. It should be entertainment, not stress.
          </p>
        </div>
      </motion.div>

      {/* Help Resources */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Phone className="w-6 h-6 text-primary" />
          Get Help & Support
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {helpResources.map((resource) => (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-5 rounded-xl glass border border-border/50 hover:border-primary/50 transition-all group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{resource.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{resource.region}</span>
                </div>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-6 px-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : content ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 md:p-12 prose prose-invert prose-lg max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-0 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-4
            prose-h3:text-2xl prose-h3:text-red-400 prose-h3:mt-10 prose-h3:mb-5
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg
            prose-ul:text-muted-foreground prose-ul:text-base md:prose-ul:text-lg
            prose-li:marker:text-red-400 prose-li:my-2
            prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            [&_h3]:scroll-mt-24"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 md:p-12 space-y-10"
        >
          <div>
            <h2 className="text-3xl font-bold mb-6 border-b border-border/50 pb-4">Responsible Gambling</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Gambling should be fun and entertaining, not a way to make money. This page provides important information and resources to help you gamble responsibly.
            </p>
          </div>

          <div ref={(el) => (sectionRefs.current["set-limits"] = el)} id="set-limits" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-red-400 mb-5">Set Limits</h3>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Always set a budget before you start and stick to it. Here are some tips:
            </p>
            <ul className="text-muted-foreground text-lg space-y-2 list-disc list-inside">
              <li>Decide how much money you can afford to lose before you start</li>
              <li>Set a time limit for your gambling sessions</li>
              <li>Never gamble with money you need for essential expenses</li>
              <li>Don't chase your losses - accept them as part of the entertainment cost</li>
              <li>Take regular breaks and step away from the screen</li>
            </ul>
          </div>

          <div ref={(el) => (sectionRefs.current["warning-signs"] = el)} id="warning-signs" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-red-400 mb-5">Know the Warning Signs</h3>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              If gambling is affecting your relationships, finances, or mental health, it may be time to seek help. Warning signs include:
            </p>
            <ul className="text-muted-foreground text-lg space-y-2 list-disc list-inside">
              <li>Spending more money or time gambling than you intended</li>
              <li>Feeling restless or irritable when trying to stop gambling</li>
              <li>Lying to family members about your gambling habits</li>
              <li>Borrowing money or selling possessions to fund gambling</li>
              <li>Neglecting work, family, or other responsibilities</li>
              <li>Gambling to escape problems or relieve feelings of helplessness</li>
            </ul>
          </div>

          <div ref={(el) => (sectionRefs.current["get-help"] = el)} id="get-help" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-red-400 mb-5">Get Help</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              If you or someone you know has a gambling problem, please reach out to a professional helpline in your country. Help is available 24/7, and all calls are confidential. Remember, seeking help is a sign of strength, not weakness.
            </p>
          </div>

          <div ref={(el) => (sectionRefs.current["age-restriction"] = el)} id="age-restriction" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-red-400 mb-5">Age Restriction</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              You must be 18 years or older (or the legal gambling age in your jurisdiction) to participate in gambling activities. Always play responsibly and verify that online gambling is legal in your area before participating.
            </p>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.25 }}
        className="text-center space-y-4 pb-8"
      >
        <p className="text-lg font-semibold">Need to talk to someone?</p>
        <Button 
          variant="outline" 
          size="lg"
          className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
          onClick={() => window.open('https://www.gamblersanonymous.org', '_blank')}
        >
          <Phone className="w-4 h-4" />
          Contact a Helpline
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Remember: Gambling should be fun. If it stops being fun, stop gambling.
        </p>
      </motion.div>
    </div>
  );
}