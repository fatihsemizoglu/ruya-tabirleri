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
import { lazy, Suspense } from "react";
const queryClient = new QueryClient();

// Lazy load page components
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Search = lazy(() => import("./pages/Search"));
const DreamDetail = lazy(() => import("./pages/DreamDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const Popular = lazy(() => import("./pages/Popular"));
const AlphabetList = lazy(() => import("./pages/AlphabetList"));
const Profile = lazy(() => import("./pages/Profile"));
const DreamJournal = lazy(() => import("./pages/DreamJournal"));
const Favorites = lazy(() => import("./pages/Favorites"));
const History = lazy(() => import("./pages/History"));
const Admin = lazy(() => import("./pages/Admin"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogTag = lazy(() => import("./pages/BlogTag"));
const Install = lazy(() => import("./pages/Install"));
const SubscriptionVerify = lazy(() => import("./pages/SubscriptionVerify"));
const SubscriptionCancel = lazy(() => import("./pages/SubscriptionCancel"));
const DreamInterpret = lazy(() => import("./pages/DreamInterpret"));

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Suspense fallback={<div>Loading...</div>}><Index /></Suspense>}></Route>
        <Route path="/ruya-yorumlat" element={<Suspense fallback={<div>Loading...</div>}><DreamInterpret /></Suspense>}></Route>
        <Route path="/giris" element={<Suspense fallback={<div>Loading...</div>}><Auth mode="login" /></Suspense>}></Route>
        <Route path="/kayit" element={<Suspense fallback={<div>Loading...</div>}><Auth mode="register" /></Suspense>}></Route>
        <Route path="/ara" element={<Suspense fallback={<div>Loading...</div>}><Search /></Suspense>}></Route>
        <Route path="/ruya/:slug" element={<Suspense fallback={<div>Loading...</div>}><DreamDetail /></Suspense>}></Route>
        <Route path="/ruya-tabirleri" element={<Suspense fallback={<div>Loading...</div>}><Popular /></Suspense>}></Route>
        <Route path="/kategoriler" element={<Suspense fallback={<div>Loading...</div>}><Categories /></Suspense>}></Route>
        <Route path="/kategori/:slug" element={<Suspense fallback={<div>Loading...</div>}><CategoryDetail /></Suspense>}></Route>
        <Route path="/populer" element={<Suspense fallback={<div>Loading...</div>}><Popular /></Suspense>}></Route>
        <Route path="/az" element={<Suspense fallback={<div>Loading...</div>}><AlphabetList /></Suspense>}></Route>
        <Route path="/az/:letter" element={<Suspense fallback={<div>Loading...</div>}><AlphabetList /></Suspense>}></Route>
        <Route path="/profil" element={<Suspense fallback={<div>Loading...</div>}><Profile /></Suspense>}></Route>
        <Route path="/ruya-gunlugum" element={<Suspense fallback={<div>Loading...</div>}><DreamJournal /></Suspense>}></Route>
        <Route path="/favorilerim" element={<Suspense fallback={<div>Loading...</div>}><Favorites /></Suspense>}></Route>
        <Route path="/gecmis" element={<Suspense fallback={<div>Loading...</div>}><History /></Suspense>}></Route>
        <Route path="/admin/*" element={<Suspense fallback={<div>Loading...</div>}><Admin /></Suspense>}></Route>
        <Route path="/hakkimizda" element={<Suspense fallback={<div>Loading...</div>}><About /></Suspense>}></Route>
        <Route path="/iletisim" element={<Suspense fallback={<div>Loading...</div>}><Contact /></Suspense>}></Route>
        <Route path="/gizlilik" element={<Suspense fallback={<div>Loading...</div>}><Privacy /></Suspense>}></Route>
        <Route path="/kullanim-kosullari" element={<Suspense fallback={<div>Loading...</div>}><Terms /></Suspense>}></Route>
        <Route path="/blog" element={<Suspense fallback={<div>Loading...</div>}><Blog /></Suspense>}></Route>
        <Route path="/blog/etiket/:tag" element={<Suspense fallback={<div>Loading...</div>}><BlogTag /></Suspense>}></Route>
        <Route path="/yukle" element={<Suspense fallback={<div>Loading...</div>}><Install /></Suspense>}></Route>
        <Route path="/abonelik-dogrula" element={<Suspense fallback={<div>Loading...</div>}><SubscriptionVerify /></Suspense>}></Route>
        <Route path="/abonelik-iptal" element={<Suspense fallback={<div>Loading...</div>}><SubscriptionCancel /></Suspense>}></Route>
        <Route path="*" element={<Suspense fallback={<div>Loading...</div>}><NotFound /></Suspense>}></Route>
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