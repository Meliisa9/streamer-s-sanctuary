import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FileText, Scale, Users, AlertTriangle, Gavel, ChevronRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitize";

const quickLinks = [
  { icon: Users, label: "Eligibility", id: "eligibility" },
  { icon: Scale, label: "User Conduct", id: "user-conduct" },
  { icon: BookOpen, label: "Giveaways", id: "giveaways" },
  { icon: AlertTriangle, label: "Disclaimers", id: "disclaimers" },
  { icon: Gavel, label: "Liability", id: "liability" },
];

export default function TermsOfService() {
  const location = useLocation();
  
  const { data: content, isLoading } = useQuery({
    queryKey: ["legal-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "legal_terms_of_service")
        .maybeSingle();
      if (error) throw error;
      return data?.value as string | null;
    },
  });

  const defaultContent = `
    <h2 id="terms-of-service" class="scroll-mt-24">Terms of Service</h2>
    <p>Welcome to our platform. By using our services, you agree to these terms.</p>
    
    <h3 id="eligibility" class="scroll-mt-24">Eligibility</h3>
    <p>You must be at least 18 years old to use this service. By accessing our platform, you confirm that you meet this age requirement and that gambling is legal in your jurisdiction.</p>
    
    <h3 id="user-conduct" class="scroll-mt-24">User Conduct</h3>
    <p>You agree to use our services only for lawful purposes. Prohibited activities include:</p>
    <ul>
      <li>Harassment or abuse of other users</li>
      <li>Attempting to manipulate giveaways or votes</li>
      <li>Creating multiple accounts for fraudulent purposes</li>
      <li>Sharing inappropriate or illegal content</li>
    </ul>
    
    <h3 id="giveaways" class="scroll-mt-24">Giveaways & Promotions</h3>
    <p>Giveaways are subject to specific rules stated at the time of entry. Key points include:</p>
    <ul>
      <li>Only one entry per person unless otherwise stated</li>
      <li>Winners must claim prizes within the specified timeframe</li>
      <li>We reserve the right to disqualify fraudulent entries</li>
      <li>Prizes are non-transferable unless otherwise specified</li>
    </ul>
    
    <h3 id="disclaimers" class="scroll-mt-24">Disclaimers</h3>
    <p>This platform showcases gambling entertainment. We do not operate a casino or accept bets. Important disclaimers:</p>
    <ul>
      <li>Content shown represents rare outcomes and is not typical</li>
      <li>We are not responsible for any gambling losses you incur</li>
      <li>Always gamble responsibly and within your means</li>
    </ul>
    
    <h3 id="liability" class="scroll-mt-24">Limitation of Liability</h3>
    <p>We are not liable for any damages arising from your use of our services, including but not limited to direct, indirect, incidental, or consequential damages. Use our platform at your own risk.</p>
  `;

  // Handle anchor scrolling after content loads
  useEffect(() => {
    if (!isLoading && location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [isLoading, location.hash]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent p-8 md:p-12"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <FileText className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Terms of Service</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Please read these terms carefully before using our platform. By accessing our services, you agree to be bound by these conditions.
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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
            >
              <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
              <span className="text-sm font-medium">{link.label}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Important Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-start gap-4 p-5 rounded-xl bg-amber-500/10 border border-amber-500/20"
      >
        <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-200">Age Requirement</p>
          <p className="text-sm text-muted-foreground mt-1">
            You must be at least 18 years old (or the legal age in your jurisdiction) to use this platform. Content may contain gambling-related material intended for adult audiences only.
          </p>
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-6 px-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-2/3 mt-8" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 md:p-12 prose prose-invert prose-lg max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-0 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-4
            prose-h3:text-2xl prose-h3:text-blue-400 prose-h3:mt-10 prose-h3:mb-5
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg
            prose-ul:text-muted-foreground prose-ul:text-base md:prose-ul:text-lg
            prose-li:marker:text-blue-400 prose-li:my-2
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            [&_h3]:scroll-mt-24"
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
        <p className="mt-2">These terms may be updated periodically. Continued use constitutes acceptance.</p>
      </motion.div>
    </div>
  );
}