import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";
import { Twitter, Youtube, Instagram, MessageCircle, Heart, Twitch, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
  default: Globe,
};

export const Footer = forwardRef<HTMLElement, ComponentPropsWithoutRef<"footer">>(
  function Footer(props, ref) {
    const { className, ...rest } = props;
    const { settings } = useSiteSettings();

    const getIcon = (iconName: string | undefined) => {
      if (!iconName) return Globe;
      return iconMap[iconName.toLowerCase()] || Globe;
    };

    const socialLinks = [
      { icon: getIcon(settings.social_twitter_icon as string), href: settings.social_twitter || "#", label: "Twitter" },
      { icon: getIcon(settings.social_youtube_icon as string), href: settings.social_youtube || "#", label: "YouTube" },
      { icon: getIcon(settings.social_instagram_icon as string), href: settings.social_instagram || "#", label: "Instagram" },
      { icon: getIcon(settings.social_discord_icon as string), href: settings.social_discord || "#", label: "Discord" },
    ];

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
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={settings.site_name} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-neon flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">{settings.site_name[0]}</span>
                </div>
              )}
              <span className="font-space-grotesk font-bold text-xl">{settings.site_name}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your premium destination for casino streaming entertainment, exclusive
              bonuses, and exciting giveaways.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
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
