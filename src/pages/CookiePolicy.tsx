import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Cookie, Settings, BarChart3, Shield, Zap, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitize";

const quickLinks = [
  { icon: Cookie, label: "What Are Cookies", id: "what-are-cookies" },
  { icon: Zap, label: "Essential Cookies", id: "essential" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Settings, label: "Managing Cookies", id: "managing" },
];

const cookieTypes = [
  { 
    name: "Essential", 
    description: "Required for basic website functionality", 
    icon: Shield,
    color: "text-green-400",
    bgColor: "bg-green-500/10 border-green-500/20"
  },
  { 
    name: "Analytics", 
    description: "Help us understand how you use our site", 
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20"
  },
  { 
    name: "Functional", 
    description: "Remember your preferences and settings", 
    icon: Settings,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20"
  },
  { 
    name: "Third-Party", 
    description: "Set by external services like embedded players", 
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20"
  },
];

export default function CookiePolicy() {
  const { data: content, isLoading } = useQuery({
    queryKey: ["legal-cookies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "legal_cookie_policy")
        .maybeSingle();
      if (error) throw error;
      return data?.value as string | null;
    },
  });

  const defaultContent = `
    <h2>Cookie Policy</h2>
    <p>This website uses cookies to enhance your browsing experience.</p>
    <h3 id="what-are-cookies">What Are Cookies?</h3>
    <p>Cookies are small text files stored on your device when you visit a website.</p>
    <h3 id="essential">Essential Cookies</h3>
    <p>These cookies are necessary for the website to function properly.</p>
    <h3 id="analytics">Analytics Cookies</h3>
    <p>We use analytics to understand how visitors interact with our site.</p>
    <h3 id="managing">Managing Cookies</h3>
    <p>You can manage cookie preferences through your browser settings.</p>
  `;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent p-8 md:p-12"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <Cookie className="w-10 h-10 text-amber-400" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Cookie Policy</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. Learn how we use cookies and how you can manage them.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="relative mt-8 flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
            >
              <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
              <span className="text-sm font-medium">{link.label}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Cookie Types Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {cookieTypes.map((type, index) => (
          <motion.div
            key={type.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.05 }}
            className={`p-4 rounded-xl border ${type.bgColor}`}
          >
            <type.icon className={`w-6 h-6 ${type.color} mb-2`} />
            <h3 className="font-semibold text-sm">{type.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
          </motion.div>
        ))}
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
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-8 md:p-10 prose prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-0 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-4
            prose-h3:text-xl prose-h3:text-amber-400 prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-ul:text-muted-foreground prose-li:marker:text-amber-400
            prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || defaultContent) }}
        />
      )}

      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.2 }}
        className="text-center text-sm text-muted-foreground pb-8"
      >
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <p className="mt-2">You can update your cookie preferences through your browser settings.</p>
      </motion.div>
    </div>
  );
}
