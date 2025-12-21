import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface StoreTermsSettings {
  store_terms_enabled: boolean;
  store_terms_intro: string;
  store_terms_faq: Array<{ question: string; answer: string }>;
  store_terms_footer_text: string;
  store_terms_footer_links: Array<{ label: string; url: string }>;
  store_restock_info: string;
  store_delivery_info: string;
}

const defaultSettings: StoreTermsSettings = {
  store_terms_enabled: true,
  store_terms_intro: "Welcome to our Points Store! Please read the following frequently asked questions to understand how our store works.",
  store_terms_faq: [
    {
      question: "HOW DO I COLLECT POINTS?",
      answer: "Points are earned by watching streams, participating in community events, daily check-ins, and engaging with our content. Points will also be rewarded on every big win!"
    },
    {
      question: "WHAT CAN I DO WITH MY POINTS?",
      answer: "You can use your points to claim items from the store. The range of products will change regularly, so stay tuned and don't spend them all right away."
    },
    {
      question: "HOW TO CHECK IF AN ITEM IS UPDATED OR SOLD OUT WHILE I WAS BROWSING?",
      answer: "Instead of reloading a whole Store page over and over again, there is a faster way to get updates about available items. Click on a button next to a Search field represented as an image of two arrows forming a circle. This action will refresh the Store and show if any new item has been added or if the specific item is sold out."
    },
    {
      question: "WHEN IS THE RESTOCK OF THE STORE?",
      answer: "The store will be restocked every stream."
    },
    {
      question: "HOW DO I CLAIM AN ITEM IN THE STORE?",
      answer: "You simply go to the Store, check the available items, and claim the one you have enough points to purchase. However, be aware that your purchase needs to be approved by the moderators. Once that happens, you will be notified."
    },
    {
      question: "HOW LONG WILL IT TAKE TO GET AN ITEM?",
      answer: "Digital items will be credited to your account within 14 business days from the day of the approval. Sending merchandise means using 3rd party services and their terms will also apply to the shipping procedure. Please read T&C carefully so you can be aware of how the entire process works."
    },
    {
      question: "WHY IS THE STORE OUT OF STOCK?",
      answer: "The store gets restocked every stream. Don't see your points as a demand to get items, but as a possibility to reward your watching time of the stream. It's more of a giveaway store and as an option to convert your points to prizes."
    }
  ],
  store_terms_footer_text: "For more information, please check our Terms of Service and Privacy Policy.",
  store_terms_footer_links: [
    { label: "Terms of Service", url: "/terms" },
    { label: "Privacy Policy", url: "/privacy" }
  ],
  store_restock_info: "Latest restock information will be announced on stream.",
  store_delivery_info: "Item will be credited within 14 BUSINESS DAYS from the day of the approval."
};

export default function StoreTerms() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-terms-settings"],
    queryFn: async () => {
      const keys = Object.keys(defaultSettings);
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", keys);
      
      if (error) throw error;

      const loadedSettings: StoreTermsSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof StoreTermsSettings;
        if (key in loadedSettings) {
          loadedSettings[key] = row.value as never;
        }
      });

      return loadedSettings;
    },
  });

  const terms = settings || defaultSettings;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Store T&C</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Store <span className="text-primary">Terms & Conditions</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {terms.store_terms_intro}
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto space-y-4"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {terms.store_terms_faq.map((item, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left font-semibold text-sm md:text-base uppercase tracking-wide hover:no-underline py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 pt-0">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.answer }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Footer Links */}
          {terms.store_terms_footer_links.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 p-6 rounded-xl bg-muted/30 border border-border/50 text-center"
            >
              <p className="text-muted-foreground mb-4">{terms.store_terms_footer_text}</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {terms.store_terms_footer_links.map((link, index) => (
                  <Link
                    key={index}
                    to={link.url}
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    {link.label}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
