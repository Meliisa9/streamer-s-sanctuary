import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { sanitizeHtml } from "@/lib/sanitize";

interface StoreTermsSettings {
  store_terms_enabled: boolean;
  store_terms_title: string;
  store_terms_content: string;
  store_terms_footer_text: string;
  store_terms_footer_links: Array<{ label: string; url: string }>;
}

const defaultSettings: StoreTermsSettings = {
  store_terms_enabled: true,
  store_terms_title: "Terms and Conditions",
  store_terms_content: `<h2>Store</h2>
<p>By creating an account, you agree to the Terms and Conditions, Privacy Policy, Cookies Policy on our web-site as well as the Terms and Conditions of the Store. As is the case with using our web-site, you are required to be 18+ years old at all times during the use of the Store. Please provide accurate and complete information, as failure to do so may result in your user account being banned or deleted.</p>

<p>We will facilitate and promote prizes sponsored by affiliated Casinos on our website "Store" page with the sole purpose of showing gratitude to and rewarding our loyal users.</p>

<p>In order to use the Store, users will need to have previously collected Points by watching live-streams via the Streaming Platforms made available for the users. Points are earned by streaming, special giveaways, and certain Holiday events. Each sponsored item in the Store varies in cost, ranging from 0 Points to X amount of Points based on the kind of prize available in the Store. The user may only use their (one) own account to make trades in the Store. The use of multiple accounts or multiple tabs in a browser under a single account by the same person is strictly prohibited and may result in a temporary banning or deletion of your account. Using someone else's account for the same purpose is also prohibited. Using multiple tabs in a browser, multiple browsers, or any other form of manipulation of the system while logged in to your user account in order to collect points will be considered Bug Abuse. Any and all forms of Bug Abuse are prohibited throughout the website, and will result in the banning and closure of your account in accordance with the Terms.</p>

<p>The sponsored items in the Store may be pecuniary or non-pecuniary in nature. Our users will be able to browse through available sponsored items via the Store on our website. Upon claiming a prize for Points in the store, the user will receive a "pending" notification of the trade, and a "approved"/"rejected" notification once the action has been reviewed. After approval, it may take up to 14 business days for the prize to be credited. Transfer of prize(s) from one user to another user is prohibited.</p>

<p>The user alone is responsible for any and all fees and/or taxes that may or may not accrue when accepting a prize of pecuniary or non-pecuniary nature. This is including but not limited to: shipping costs, import fees, import taxes, taxes and or fees associated with the transfer of any type of item, any and all taxes due upon the withdrawal of a pecuniary nature or sum from any of the sponsored casinos, etc.</p>

<p>The user agrees to hold harmless us and our employees, staff, moderators, officers, directors, legal counsel, its affiliates, etc. against any and all losses, claims, damages and liabilities, joint or several, and expenses (including all legal or other expenses reasonably incurred) arising out of or relating to a trade for an item(s) of either pecuniary or non-pecuniary nature in the Store or anywhere items, prizes, etc. are found on the website.</p>

<p>The sponsored items available in the Store may be limited to a certain number of items per user, and may be available for a limited time while supplies last. We reserve the right to apply a "cool-down" period after the trade of Points for an item(s) in the Store. The items in the Store may or may not be based on user location. Any and all sponsored items offered in the Store are subject to the Terms and Conditions of the Casino that sponsors the item.</p>

<p>We reserve the right to change the Store Terms and Conditions, as well as the items available to trade in the Store at any point without prior notice. In the event that we decide to change the terms and conditions, prize, or sponsored item, we will post the changes on our web-site.</p>

<p>Only one account is allowed for your real personal data. Opening an account is allowed only for one person, using one address, one phone number, and one IP address. If a person creates additional accounts on the Website, all such accounts will be classified as "Multiple Accounts". In that case, we reserve the right to close all of the Multiple Accounts and to apply the following sanctions: each action performed using a Multiple Account is considered void.</p>

<p>In the event that Multiple Accounts are identified or reasonably suspected, any sponsored items obtained through such accounts shall be revoked and we retain the right to ask for the return of those assets. We reserve the right to cancel all participation in any promotion, as well as permanently ban any user from the Website. We also reserve the right to disallow opening an account or close an existing account without prior written notice or any explanation.</p>

<p>We reserve the right to hold and use testing accounts in order to improve the function of our website. We strive to always improve the quality of our site for our users, and to do so we must use test accounts. If any test account or staff account is used to test the Store, or trades Points for an item, they will be ineligible to receive the item.</p>

<h3>Disclaimer</h3>
<p>We do not accept any sort of monetary transactions on our website. Our focus is solely on marketing services and offers from Casinos which the user gets for FREE from us. We promote casinos and offers where a user, if they feel so inclined, can go to play games and place bets with their personal money. We do not allow any sort of monetary transactions between a user and our company and its staff for gaming, giveaway, Store, or any other purposes on our website, or off our website.</p>`,
  store_terms_footer_text: "For more information, please check our Terms of Service and Privacy Policy.",
  store_terms_footer_links: [
    { label: "Terms of Service", url: "/terms" },
    { label: "Privacy Policy", url: "/privacy" },
  ],
};

export default function StoreTerms() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-terms-legal-settings"],
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
              Store <span className="text-primary">{terms.store_terms_title}</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* T&C Content */}
      <section className="container py-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="p-8 rounded-2xl bg-card border border-border">
            <div
              className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(terms.store_terms_content) }}
            />
          </div>

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
