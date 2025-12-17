import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function CookiePolicy() {
  const { data: content, isLoading } = useQuery({
    queryKey: ["legal-cookies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "legal_cookie_policy")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as string | null;
    },
  });

  const defaultContent = `
    <h2>Cookie Policy</h2>
    <p>This website uses cookies to enhance your browsing experience.</p>
    <h3>What Are Cookies?</h3>
    <p>Cookies are small text files stored on your device when you visit a website.</p>
    <h3>How We Use Cookies</h3>
    <p>We use cookies to remember your preferences and improve our services.</p>
    <h3>Managing Cookies</h3>
    <p>You can manage cookie preferences through your browser settings.</p>
  `;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Cookie className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Cookie Policy</h1>
          <p className="text-muted-foreground">How we use cookies</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content || defaultContent }}
        />
      )}
    </div>
  );
}
