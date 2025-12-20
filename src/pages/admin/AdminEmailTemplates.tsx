import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Mail, Loader2, Eye, Code, Copy, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  template_type: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const templateTypes = [
  { value: "system", label: "System" },
  { value: "giveaway", label: "Giveaway" },
  { value: "event", label: "Event" },
  { value: "bonus_hunt", label: "Bonus Hunt" },
  { value: "social", label: "Social" },
  { value: "notification", label: "Notification" },
];

const typeColors: Record<string, string> = {
  system: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  giveaway: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  event: "bg-green-500/10 text-green-500 border-green-500/20",
  bonus_hunt: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  social: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  notification: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

// Premium pre-made templates with rich visual content including images and icons
const premadeTemplates = [
  {
    name: "welcome_user",
    subject: "🎰 Welcome to {{site_name}} - Your Journey to Epic Wins Begins!",
    template_type: "system",
    variables: "username, site_name, site_url",
    body_html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#0a0a0f;"><div style="max-width:640px;margin:0 auto;"><div style="background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 50%,#f97316 100%);padding:4px;border-radius:0 0 24px 24px;"><div style="background:linear-gradient(180deg,#12121a 0%,#1a1a2e 100%);padding:0;border-radius:0 0 20px 20px;"><div style="position:relative;overflow:hidden;"><img src="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=640&h=200&fit=crop" alt="Casino" style="width:100%;height:200px;object-fit:cover;opacity:0.4;"/><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,#12121a 100%);"></div><div style="position:absolute;bottom:20px;left:0;right:0;text-align:center;"><div style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);width:80px;height:80px;border-radius:20px;box-shadow:0 20px 60px rgba(139,92,246,0.5);"><div style="padding:16px;"><span style="font-size:44px;line-height:1;">🎰</span></div></div></div></div><div style="padding:32px 40px 48px;"><h1 style="color:#fff;font-size:36px;font-weight:800;text-align:center;margin:0 0 8px 0;">Welcome, {{username}}!</h1><p style="color:#a78bfa;font-size:18px;text-align:center;margin:0 0 40px 0;font-weight:500;">Your VIP pass to epic wins is activated</p><table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;"><tr><td width="33%" style="text-align:center;padding:16px;"><div style="background:linear-gradient(145deg,rgba(139,92,246,0.2),rgba(139,92,246,0.05));border-radius:16px;padding:20px;"><img src="https://img.icons8.com/3d-fluency/94/gift.png" alt="Giveaways" style="width:48px;height:48px;margin-bottom:8px;"/><p style="color:#8b5cf6;font-size:24px;font-weight:800;margin:0;">50+</p><p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0 0;">Giveaways</p></div></td><td width="33%" style="text-align:center;padding:16px;"><div style="background:linear-gradient(145deg,rgba(236,72,153,0.2),rgba(236,72,153,0.05));border-radius:16px;padding:20px;"><img src="https://img.icons8.com/3d-fluency/94/trophy.png" alt="Winners" style="width:48px;height:48px;margin-bottom:8px;"/><p style="color:#ec4899;font-size:24px;font-weight:800;margin:0;">1K+</p><p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0 0;">Winners</p></div></td><td width="33%" style="text-align:center;padding:16px;"><div style="background:linear-gradient(145deg,rgba(16,185,129,0.2),rgba(16,185,129,0.05));border-radius:16px;padding:20px;"><img src="https://img.icons8.com/3d-fluency/94/money-bag.png" alt="Prizes" style="width:48px;height:48px;margin-bottom:8px;"/><p style="color:#10b981;font-size:24px;font-weight:800;margin:0;">$50K</p><p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0 0;">In Prizes</p></div></td></tr></table><div style="margin-bottom:32px;"><div style="background:linear-gradient(145deg,rgba(139,92,246,0.15) 0%,rgba(139,92,246,0.05) 100%);border:1px solid rgba(139,92,246,0.3);border-radius:16px;padding:24px;margin-bottom:12px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="60" valign="top"><img src="https://img.icons8.com/3d-fluency/94/confetti.png" alt="Giveaways" style="width:48px;height:48px;"/></td><td style="padding-left:16px;"><h3 style="color:#fff;font-size:18px;font-weight:700;margin:0 0 6px 0;">Daily Giveaways</h3><p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.6;">Win cash, crypto, and exclusive gaming prizes every single day!</p></td></tr></table></div><div style="background:linear-gradient(145deg,rgba(236,72,153,0.15) 0%,rgba(236,72,153,0.05) 100%);border:1px solid rgba(236,72,153,0.3);border-radius:16px;padding:24px;margin-bottom:12px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="60" valign="top"><img src="https://img.icons8.com/3d-fluency/94/target.png" alt="Predictions" style="width:48px;height:48px;"/></td><td style="padding-left:16px;"><h3 style="color:#fff;font-size:18px;font-weight:700;margin:0 0 6px 0;">Bonus Hunt Predictions</h3><p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.6;">Guess the total win amount and climb the leaderboard!</p></td></tr></table></div><div style="background:linear-gradient(145deg,rgba(16,185,129,0.15) 0%,rgba(16,185,129,0.05) 100%);border:1px solid rgba(16,185,129,0.3);border-radius:16px;padding:24px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="60" valign="top"><img src="https://img.icons8.com/3d-fluency/94/crown.png" alt="Rewards" style="width:48px;height:48px;"/></td><td style="padding-left:16px;"><h3 style="color:#fff;font-size:18px;font-weight:700;margin:0 0 6px 0;">Earn Points & Rewards</h3><p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.6;">Every interaction earns you points. Unlock exclusive badges!</p></td></tr></table></div></div><div style="text-align:center;"><a href="{{site_url}}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);color:#fff;text-decoration:none;padding:20px 56px;border-radius:16px;font-weight:700;font-size:18px;box-shadow:0 16px 48px rgba(139,92,246,0.5);">🚀 Start Your Journey</a></div></div></div></div><div style="background:#0a0a0f;padding:32px 40px;text-align:center;"><p style="color:#64748b;font-size:13px;margin:0;">© {{site_name}} • The Ultimate Casino Streaming Experience</p></div></div></body></html>`,
  },
  {
    name: "giveaway_winner",
    subject: "🏆 WINNER! You Won the {{giveaway_name}} Giveaway!",
    template_type: "giveaway",
    variables: "username, giveaway_name, prize, claim_link, site_name",
    body_html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#0a0a0f;"><div style="max-width:640px;margin:0 auto;"><div style="background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#d97706 100%);padding:4px;border-radius:0 0 24px 24px;"><div style="background:linear-gradient(180deg,#12121a 0%,#1a1a2e 100%);padding:0;border-radius:0 0 20px 20px;"><div style="position:relative;background:linear-gradient(135deg,rgba(251,191,36,0.2) 0%,rgba(217,119,6,0.1) 100%);padding:48px 40px;text-align:center;"><div style="position:absolute;top:10px;left:10%;font-size:24px;">🎊</div><div style="position:absolute;top:20px;right:15%;font-size:32px;">🎉</div><div style="position:absolute;top:30px;left:25%;font-size:20px;">✨</div><div style="position:absolute;top:15px;right:25%;font-size:28px;">🎊</div><img src="https://img.icons8.com/3d-fluency/188/trophy.png" alt="Trophy" style="width:120px;height:120px;margin-bottom:16px;filter:drop-shadow(0 20px 40px rgba(251,191,36,0.5));"/><h1 style="color:#fbbf24;font-size:42px;font-weight:800;margin:0 0 8px 0;text-shadow:0 4px 24px rgba(251,191,36,0.4);">CONGRATULATIONS!</h1><p style="color:#fde68a;font-size:20px;font-weight:600;margin:0;">{{username}}, You're a Winner! 🎯</p></div><div style="padding:40px;"><div style="background:linear-gradient(145deg,#1e1e2f 0%,#16162a 100%);border:2px solid rgba(251,191,36,0.4);border-radius:24px;padding:40px;margin-bottom:32px;text-align:center;"><p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:3px;margin:0 0 16px 0;">🎁 Your Prize</p><h2 style="color:#fbbf24;font-size:40px;font-weight:800;margin:0 0 16px 0;text-shadow:0 0 60px rgba(251,191,36,0.6);">{{prize}}</h2><div style="display:inline-block;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);border-radius:12px;padding:12px 24px;"><p style="color:#94a3b8;font-size:14px;margin:0;">from <strong style="color:#fbbf24;">{{giveaway_name}}</strong></p></div></div><div style="text-align:center;margin-bottom:24px;"><a href="{{claim_link}}" style="display:inline-block;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);color:#0a0a0f;text-decoration:none;padding:22px 64px;border-radius:16px;font-weight:800;font-size:20px;text-transform:uppercase;box-shadow:0 16px 48px rgba(251,191,36,0.5);">🏆 Claim Your Prize Now</a></div><div style="background:linear-gradient(145deg,rgba(239,68,68,0.15) 0%,rgba(239,68,68,0.05) 100%);border:2px solid rgba(239,68,68,0.4);border-radius:16px;padding:20px;text-align:center;"><table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="padding-right:12px;"><img src="https://img.icons8.com/3d-fluency/94/alarm-clock.png" alt="Clock" style="width:40px;height:40px;"/></td><td><p style="color:#ef4444;font-size:15px;font-weight:700;margin:0 0 2px 0;">⚠️ Time-Sensitive</p><p style="color:#fca5a5;font-size:13px;margin:0;">Please claim within <strong>48 hours</strong></p></td></tr></table></div></div></div></div><div style="background:#0a0a0f;padding:32px 40px;text-align:center;"><p style="color:#64748b;font-size:13px;margin:0;">© {{site_name}} • Giveaway Winner Notification</p></div></div></body></html>`,
  },
  {
    name: "event_reminder",
    subject: "⏰ Starting Soon: {{event_name}} - Don't Miss Out!",
    template_type: "event",
    variables: "username, event_name, event_time, event_description, watch_link, site_name",
    body_html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#0a0a0f;"><div style="max-width:640px;margin:0 auto;"><div style="background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);padding:4px;border-radius:0 0 24px 24px;"><div style="background:linear-gradient(180deg,#12121a 0%,#1a1a2e 100%);padding:0;border-radius:0 0 20px 20px;"><div style="position:relative;"><img src="https://images.unsplash.com/photo-1493711662062-fa541f7f093d?w=640&h=180&fit=crop" alt="Stream" style="width:100%;height:180px;object-fit:cover;opacity:0.5;"/><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,#12121a 100%);"></div><div style="position:absolute;top:20px;left:20px;"><span style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:11px;font-weight:700;padding:8px 16px;border-radius:50px;text-transform:uppercase;letter-spacing:2px;box-shadow:0 4px 20px rgba(239,68,68,0.5);">🔴 Starting Soon</span></div><div style="position:absolute;bottom:20px;left:0;right:0;text-align:center;"><div style="display:inline-block;background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:16px 32px;"><p style="color:#60a5fa;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px 0;">Event Time</p><p style="color:#fff;font-size:28px;font-weight:800;margin:0;">{{event_time}}</p></div></div></div><div style="padding:32px 40px 48px;"><h1 style="color:#fff;font-size:32px;font-weight:800;text-align:center;margin:0 0 8px 0;">{{event_name}}</h1><p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 32px 0;">Hey {{username}}, the event you're waiting for is about to begin!</p><div style="background:linear-gradient(145deg,rgba(59,130,246,0.15) 0%,rgba(59,130,246,0.05) 100%);border:1px solid rgba(59,130,246,0.3);border-radius:20px;padding:28px;margin-bottom:32px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="60" valign="top"><img src="https://img.icons8.com/3d-fluency/94/info.png" alt="Info" style="width:48px;height:48px;"/></td><td style="padding-left:16px;"><h3 style="color:#60a5fa;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">About This Event</h3><p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:0;">{{event_description}}</p></td></tr></table></div><div style="text-align:center;"><a href="{{watch_link}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);color:#fff;text-decoration:none;padding:20px 56px;border-radius:16px;font-weight:700;font-size:18px;box-shadow:0 16px 48px rgba(59,130,246,0.5);">📺 Watch Live Now</a></div></div></div></div><div style="background:#0a0a0f;padding:32px 40px;text-align:center;"><p style="color:#64748b;font-size:13px;margin:0;">© {{site_name}} • Event Reminder</p></div></div></body></html>`,
  },
  {
    name: "bonus_hunt_winner",
    subject: "🎯 Perfect Prediction! You Earned +{{points}} Points!",
    template_type: "bonus_hunt",
    variables: "username, hunt_name, guess, actual_result, points, site_name",
    body_html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#0a0a0f;"><div style="max-width:640px;margin:0 auto;"><div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:4px;border-radius:0 0 24px 24px;"><div style="background:linear-gradient(180deg,#12121a 0%,#1a1a2e 100%);padding:48px 40px;border-radius:0 0 20px 20px;"><div style="text-align:center;margin-bottom:24px;"><img src="https://img.icons8.com/3d-fluency/188/accuracy.png" alt="Bullseye" style="width:100px;height:100px;filter:drop-shadow(0 20px 40px rgba(16,185,129,0.5));"/></div><h1 style="color:#10b981;font-size:40px;font-weight:800;text-align:center;margin:0 0 8px 0;text-shadow:0 4px 24px rgba(16,185,129,0.4);">BULLSEYE!</h1><p style="color:#6ee7b7;font-size:18px;text-align:center;margin:0 0 40px 0;font-weight:500;">{{username}}, your prediction was incredible!</p><table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;"><tr><td width="46%" style="padding-right:12px;"><div style="background:linear-gradient(145deg,rgba(139,92,246,0.2) 0%,rgba(139,92,246,0.05) 100%);border:2px solid rgba(139,92,246,0.4);border-radius:20px;padding:28px;text-align:center;"><img src="https://img.icons8.com/3d-fluency/94/crystal-ball.png" alt="Guess" style="width:48px;height:48px;margin-bottom:12px;"/><p style="color:#a78bfa;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Your Prediction</p><p style="color:#fff;font-size:32px;font-weight:800;margin:0;">{{guess}}</p></div></td><td width="8%" style="text-align:center;vertical-align:middle;"><span style="font-size:32px;color:#64748b;">≈</span></td><td width="46%" style="padding-left:12px;"><div style="background:linear-gradient(145deg,rgba(16,185,129,0.2) 0%,rgba(16,185,129,0.05) 100%);border:2px solid rgba(16,185,129,0.4);border-radius:20px;padding:28px;text-align:center;"><img src="https://img.icons8.com/3d-fluency/94/checkmark.png" alt="Result" style="width:48px;height:48px;margin-bottom:12px;"/><p style="color:#6ee7b7;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Actual Result</p><p style="color:#10b981;font-size:32px;font-weight:800;margin:0;">{{actual_result}}</p></div></td></tr></table><div style="background:linear-gradient(145deg,rgba(16,185,129,0.25) 0%,rgba(16,185,129,0.1) 100%);border:3px solid rgba(16,185,129,0.5);border-radius:24px;padding:40px;text-align:center;margin-bottom:32px;"><img src="https://img.icons8.com/3d-fluency/94/star.png" alt="Points" style="width:56px;height:56px;margin-bottom:12px;"/><p style="color:#6ee7b7;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Points Earned</p><p style="color:#10b981;font-size:56px;font-weight:800;margin:0;text-shadow:0 0 60px rgba(16,185,129,0.6);">+{{points}}</p></div><p style="color:#64748b;font-size:14px;text-align:center;margin:0;">Hunt: <strong style="color:#94a3b8;">{{hunt_name}}</strong></p></div></div><div style="background:#0a0a0f;padding:32px 40px;text-align:center;"><p style="color:#64748b;font-size:13px;margin:0;">© {{site_name}} • Bonus Hunt Prediction</p></div></div></body></html>`,
  },
  {
    name: "new_follower",
    subject: "👋 {{follower_name}} just followed you!",
    template_type: "social",
    variables: "username, follower_name, follower_link, site_name",
    body_html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#0a0a0f;"><div style="max-width:640px;margin:0 auto;"><div style="background:linear-gradient(135deg,#ec4899 0%,#f472b6 100%);padding:4px;border-radius:0 0 24px 24px;"><div style="background:linear-gradient(180deg,#12121a 0%,#1a1a2e 100%);padding:48px 40px;border-radius:0 0 20px 20px;"><div style="text-align:center;margin-bottom:32px;"><table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="text-align:center;padding:0 20px;"><div style="width:80px;height:80px;background:linear-gradient(135deg,#ec4899,#f472b6);border-radius:50%;line-height:80px;box-shadow:0 16px 48px rgba(236,72,153,0.4);display:inline-block;"><span style="font-size:36px;">👤</span></div><p style="color:#f472b6;font-size:13px;font-weight:600;margin:12px 0 0 0;">{{follower_name}}</p></td><td style="width:80px;text-align:center;"><div style="height:4px;background:linear-gradient(90deg,#ec4899,#8b5cf6);border-radius:2px;position:relative;"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a2e;padding:4px;"><span style="font-size:24px;">❤️</span></div></div></td><td style="text-align:center;padding:0 20px;"><div style="width:80px;height:80px;background:linear-gradient(135deg,#8b5cf6,#a78bfa);border-radius:50%;line-height:80px;box-shadow:0 16px 48px rgba(139,92,246,0.4);display:inline-block;"><span style="font-size:36px;">👤</span></div><p style="color:#a78bfa;font-size:13px;font-weight:600;margin:12px 0 0 0;">You</p></td></tr></table></div><h1 style="color:#fff;font-size:32px;font-weight:800;text-align:center;margin:0 0 8px 0;">You Have a New Follower!</h1><p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 40px 0;">Hey {{username}}, someone new is following your journey!</p><div style="background:linear-gradient(145deg,rgba(236,72,153,0.15) 0%,rgba(236,72,153,0.05) 100%);border:2px solid rgba(236,72,153,0.3);border-radius:24px;padding:32px;margin-bottom:32px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="80" valign="top"><div style="width:72px;height:72px;background:linear-gradient(135deg,#8b5cf6,#ec4899);border-radius:50%;text-align:center;box-shadow:0 8px 32px rgba(236,72,153,0.3);"><img src="https://img.icons8.com/3d-fluency/94/user-male-circle.png" alt="Avatar" style="width:48px;height:48px;margin-top:12px;"/></div></td><td style="padding-left:20px;vertical-align:middle;"><h2 style="color:#f472b6;font-size:24px;font-weight:700;margin:0 0 4px 0;">{{follower_name}}</h2><p style="color:#94a3b8;font-size:14px;margin:0 0 12px 0;">Just started following you</p><span style="display:inline-block;background:rgba(16,185,129,0.15);color:#10b981;font-size:11px;font-weight:600;padding:6px 12px;border-radius:50px;">✓ Active Member</span></td></tr></table></div><div style="text-align:center;"><a href="{{follower_link}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#f472b6 100%);color:#fff;text-decoration:none;padding:18px 48px;border-radius:16px;font-weight:700;font-size:16px;box-shadow:0 16px 48px rgba(236,72,153,0.4);">👀 View Their Profile</a></div></div></div><div style="background:#0a0a0f;padding:32px 40px;text-align:center;"><p style="color:#64748b;font-size:13px;margin:0;">© {{site_name}} • Social Notification</p></div></div></body></html>`,
  },
];

export default function AdminEmailTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    template_type: "notification",
    variables: "",
    is_active: true,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_type", { ascending: true });
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const variables = data.variables.split(",").map(v => v.trim()).filter(Boolean);
      const { error } = await supabase.from("email_templates").insert({
        name: data.name,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text || null,
        template_type: data.template_type,
        variables,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const variables = data.variables.split(",").map(v => v.trim()).filter(Boolean);
      const { error } = await supabase.from("email_templates").update({
        name: data.name,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text || null,
        template_type: data.template_type,
        variables,
        is_active: data.is_active,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("email_templates").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", subject: "", body_html: "", body_text: "", template_type: "notification", variables: "", is_active: true });
    setEditingTemplate(null);
    setPreviewTab("edit");
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text || "",
      template_type: template.template_type,
      variables: (template.variables || []).join(", "),
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(`{{${varName}}}`);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const renderPreview = () => {
    let html = formData.body_html;
    const variables = formData.variables.split(",").map(v => v.trim()).filter(Boolean);
    variables.forEach(v => {
      html = html.replace(new RegExp(`{{${v}}}`, "g"), `<span class="bg-primary/20 px-1 rounded">[${v}]</span>`);
    });
    return html;
  };

  const addPremadeTemplates = useMutation({
    mutationFn: async () => {
      for (const template of premadeTemplates) {
        const variables = template.variables.split(",").map(v => v.trim());
        const { error } = await supabase.from("email_templates").insert({
          name: template.name,
          subject: template.subject,
          body_html: template.body_html,
          template_type: template.template_type,
          variables,
          is_active: true,
        });
        if (error && !error.message.includes("duplicate")) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Premium templates added!", description: "5 professionally designed templates with images are now available." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage email notification templates</p>
        </div>
        <div className="flex items-center gap-2">
          {templates.length === 0 && (
            <Button 
              variant="outline" 
              onClick={() => addPremadeTemplates.mutate()}
              disabled={addPremadeTemplates.isPending}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Add Premium Templates
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Template" : "Add New Template"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., welcome, giveaway_winner"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.template_type} onValueChange={(value) => setFormData({ ...formData, template_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject Line *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Welcome to {{site_name}}!"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Variables (comma-separated)</Label>
                  <Input
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    placeholder="username, site_name, prize"
                  />
                  <p className="text-xs text-muted-foreground">Use {"{{variable_name}}"} in your template to insert dynamic content</p>
                </div>

                <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as "edit" | "preview")}>
                  <TabsList>
                    <TabsTrigger value="edit" className="gap-2"><Code className="w-4 h-4" /> Edit HTML</TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2"><Eye className="w-4 h-4" /> Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="space-y-2">
                    <Label>HTML Body *</Label>
                    <Textarea
                      value={formData.body_html}
                      onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                      placeholder="<h1>Hello {{username}}!</h1>"
                      rows={12}
                      className="font-mono text-sm"
                      required
                    />
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="border border-border rounded-xl overflow-hidden bg-[#0a0a0f]">
                      <iframe
                        srcDoc={renderPreview()}
                        className="w-full min-h-[500px] border-0"
                        title="Email Preview"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label>Plain Text Body (fallback)</Label>
                  <Textarea
                    value={formData.body_text}
                    onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                    placeholder="Hello {{username}}! ..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AdminSettingsNav />

      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant="outline" className={typeColors[template.template_type]}>
                      {template.template_type}
                    </Badge>
                    {!template.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((v: string) => (
                        <button
                          key={v}
                          onClick={() => copyVariable(v)}
                          className="px-2 py-0.5 bg-secondary text-xs rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          {copiedVar === v ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: template.id, is_active: checked })}
                />
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No email templates yet. Click "Add Premium Templates" to get started with professionally designed templates featuring images, icons, and modern layouts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
