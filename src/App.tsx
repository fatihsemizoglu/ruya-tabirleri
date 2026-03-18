import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { CommandPalette } from "@/components/ui/command-palette";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import DreamDetail from "./pages/DreamDetail";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import Popular from "./pages/Popular";
import AlphabetList from "./pages/AlphabetList";
import Profile from "./pages/Profile";
import DreamJournal from "./pages/DreamJournal";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogTag from "./pages/BlogTag";
import Install from "./pages/Install";
import SubscriptionVerify from "./pages/SubscriptionVerify";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import DreamInterpret from "./pages/DreamInterpret";
const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/ruya-yorumlat" element={<DreamInterpret />} />
        <Route path="/giris" element={<Auth mode="login" />} />
        <Route path="/kayit" element={<Auth mode="register" />} />
        <Route path="/ara" element={<Search />} />
        <Route path="/ruya/:slug" element={<DreamDetail />} />
        <Route path="/ruya-tabirleri" element={<Popular />} />
        <Route path="/kategoriler" element={<Categories />} />
        <Route path="/kategori/:slug" element={<CategoryDetail />} />
        <Route path="/populer" element={<Popular />} />
        <Route path="/az" element={<AlphabetList />} />
        <Route path="/az/:letter" element={<AlphabetList />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/ruya-gunlugum" element={<DreamJournal />} />
        <Route path="/favorilerim" element={<Favorites />} />
        <Route path="/gecmis" element={<History />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/hakkimizda" element={<About />} />
        <Route path="/iletisim" element={<Contact />} />
        <Route path="/gizlilik" element={<Privacy />} />
        <Route path="/kullanim-kosullari" element={<Terms />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/etiket/:tag" element={<BlogTag />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/yukle" element={<Install />} />
        <Route path="/abonelik-dogrula" element={<SubscriptionVerify />} />
        <Route path="/abonelik-iptal" element={<SubscriptionCancel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OfflineIndicator />
          <CommandPalette />
          <OnboardingTour />
          <InstallPrompt />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
