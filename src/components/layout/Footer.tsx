import { motion } from "framer-motion";
import { Twitter, Youtube, Instagram, MessageCircle, Mail, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: MessageCircle, href: "#", label: "Discord" },
];

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

export function Footer() {
  return (
    <footer className="bg-card/50 border-t border-border mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-neon flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">S</span>
              </div>
              <span className="font-space-grotesk font-bold text-xl">StreamerX</span>
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

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-space-grotesk font-semibold text-lg mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get notified about new giveaways and exclusive bonuses.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <Mail className="w-4 h-4" />
              </button>
            </div>
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
              © 2024 StreamerX. All rights reserved.
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
