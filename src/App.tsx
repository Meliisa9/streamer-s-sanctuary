import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Videos from "./pages/Videos";
import Bonuses from "./pages/Bonuses";
import News from "./pages/News";
import Giveaways from "./pages/Giveaways";
import Events from "./pages/Events";
import GuessTheWin from "./pages/GuessTheWin";
import Leaderboard from "./pages/Leaderboard";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminBonuses from "./pages/admin/AdminBonuses";
import AdminGiveaways from "./pages/admin/AdminGiveaways";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Route (No Layout) */}
            <Route path="/auth" element={<Auth />} />

            {/* Main Layout Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/bonuses" element={<Bonuses />} />
              <Route path="/news" element={<News />} />
              <Route path="/giveaways" element={<Giveaways />} />
              <Route path="/events" element={<Events />} />
              <Route path="/guess-the-win" element={<GuessTheWin />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="videos" element={<AdminVideos />} />
                <Route path="bonuses" element={<AdminBonuses />} />
                <Route path="giveaways" element={<AdminGiveaways />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="audit" element={<AdminAuditLog />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
