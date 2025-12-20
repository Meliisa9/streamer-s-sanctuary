import { forwardRef, type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Twitter, Youtube, Instagram, MessageCircle, Heart, Twitch, Globe, Facebook, Linkedin, Github, Send, Mail, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

const quickLinks = [
  { label: "Videos", href: "/videos" },
  { label: "Bonuses", href: "/bonuses" },
  { label: "Giveaways", href: "/giveaways" },
  { label: "News", href: "/news" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Responsible Gambling", href: "/responsible-gambling" },
];

const iconMap: Record<string, React.ElementType> = {
  twitter: Twitter,
  youtube: Youtube,
  instagram: Instagram,
  discord: MessageCircle,
  twitch: Twitch,
  facebook: Facebook,
  linkedin: Linkedin,
  github: Github,
  telegram: Send,
  mail: Mail,
  globe: Globe,
  link: LinkIcon,
  tiktok: Globe,
  reddit: Globe,
  whatsapp: MessageCircle,
  snapchat: Globe,
  pinterest: Globe,
  spotify: Globe,
  kick: Globe,
  patreon: Heart,
  default: Globe,
};

interface SocialLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  customIcon?: string;
}

// Load FontAwesome if not already loaded
const loadFontAwesome = () => {
  if (document.querySelector('link[href*="fontawesome"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
  document.head.appendChild(link);
};

export const Footer = forwardRef<HTMLElement, ComponentPropsWithoutRef<"footer">>(
  function Footer(props, ref) {
    const { className, ...rest } = props;
    const { settings } = useSiteSettings();
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

    useEffect(() => {
      fetchSocialLinks();
      loadFontAwesome();
    }, []);

    const fetchSocialLinks = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "footer_social_links")
          .single();

        if (!error && data?.value && Array.isArray(data.value)) {
          setSocialLinks(data.value as unknown as SocialLink[]);
        }
      } catch (error) {
        console.error("Error fetching social links:", error);
      }
    };

    const getIcon = (iconName: string | undefined) => {
      if (!iconName) return Globe;
      return iconMap[iconName.toLowerCase()] || Globe;
    };

    const renderSocialIcon = (social: SocialLink) => {
      if (social.icon === "custom" && social.customIcon) {
        return <i className={`${social.customIcon} text-lg`} />;
      }
      const IconComponent = getIcon(social.icon);
      return <IconComponent className="w-5 h-5" />;
    };

    return (
      <footer ref={ref} className={`bg-card/50 border-t border-border mt-auto ${className ?? ""}`.trim()} {...rest}>
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="font-space-grotesk font-bold text-xl">{settings.site_name}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your premium destination for casino streaming entertainment, exclusive
              bonuses, and exciting giveaways.
            </p>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all duration-300"
                  aria-label={social.title}
                  title={social.title}
                >
                  {renderSocialIcon(social)}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-space-grotesk font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-space-grotesk font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {settings.footer_copyright || `© ${new Date().getFullYear()} ${settings.site_name}. All rights reserved.`}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-destructive" /> for the community
            </p>
            <p className="text-xs text-muted-foreground max-w-md text-center md:text-right">
              Gambling can be addictive. Play responsibly. 18+
            </p>
          </div>
        </motion.div>
      </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";