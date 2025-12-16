import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Videos from "./pages/Videos";
import Bonuses from "./pages/Bonuses";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Giveaways from "./pages/Giveaways";
import Events from "./pages/Events";
import GuessTheWin from "./pages/GuessTheWin";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminBonuses from "./pages/admin/AdminBonuses";
import AdminGiveaways from "./pages/admin/AdminGiveaways";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminNews from "./pages/admin/AdminNews";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminGTW from "./pages/admin/AdminGTW";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SiteSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/bonuses" element={<Bonuses />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug" element={<NewsArticle />} />
                <Route path="/giveaways" element={<Giveaways />} />
                <Route path="/events" element={<Events />} />
                <Route path="/guess-the-win" element={<GuessTheWin />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="videos" element={<AdminVideos />} />
                  <Route path="bonuses" element={<AdminBonuses />} />
                  <Route path="giveaways" element={<AdminGiveaways />} />
                  <Route path="news" element={<AdminNews />} />
                  <Route path="events" element={<AdminEvents />} />
                  <Route path="gtw" element={<AdminGTW />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="audit" element={<AdminAuditLog />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
