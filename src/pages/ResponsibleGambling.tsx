import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResponsibleGambling() {
  const { data: content, isLoading } = useQuery({
    queryKey: ["legal-gambling"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "legal_responsible_gambling")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as string | null;
    },
  });

  const defaultContent = `
    <h2>Responsible Gambling</h2>
    <p>Gambling should be fun and entertaining, not a way to make money.</p>
    <h3>Set Limits</h3>
    <p>Always set a budget before you start and stick to it. Never gamble more than you can afford to lose.</p>
    <h3>Know the Signs</h3>
    <p>If gambling is affecting your relationships, finances, or mental health, it may be time to seek help.</p>
    <h3>Get Help</h3>
    <p>If you or someone you know has a gambling problem, please reach out to a professional helpline in your country.</p>
    <h3>Age Restriction</h3>
    <p>You must be 18 years or older to participate in gambling activities. Always play responsibly.</p>
  `;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Responsible Gambling</h1>
          <p className="text-muted-foreground">Play safe and stay in control</p>
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
