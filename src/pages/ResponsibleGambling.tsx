import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

  const defaultContent = `
    <h2>Responsible Gambling</h2>
    <p>Gambling should be fun and entertaining, not a way to make money.</p>
    <h3 id="set-limits">Set Limits</h3>
    <p>Always set a budget before you start and stick to it. Never gamble more than you can afford to lose.</p>
    <h3 id="warning-signs">Know the Warning Signs</h3>
    <p>If gambling is affecting your relationships, finances, or mental health, it may be time to seek help.</p>
    <h3 id="get-help">Get Help</h3>
    <p>If you or someone you know has a gambling problem, please reach out to a professional helpline in your country.</p>
    <h3 id="age-restriction">Age Restriction</h3>
    <p>You must be 18 years or older to participate in gambling activities. Always play responsibly.</p>
  `;

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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
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
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 md:p-10 prose prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-0 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-4
            prose-h3:text-xl prose-h3:text-red-400 prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-ul:text-muted-foreground prose-li:marker:text-red-400
            prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || defaultContent) }}
        />
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
