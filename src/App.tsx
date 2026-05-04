import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { CommandPalette } from "@/components/ui/command-palette";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Helmet, HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import { lazy, Suspense } from "react";
import { queryClient } from "@/lib/query/client";
import { Loader2 } from "lucide-react";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><Index /></Suspense>}></Route>
        <Route path="/giris" element={<Suspense fallback={<PageLoader />}><Auth mode="login" /></Suspense>}></Route>
        <Route path="/kayit" element={<Suspense fallback={<PageLoader />}><Auth mode="register" /></Suspense>}></Route>
        <Route path="/ara" element={<Suspense fallback={<PageLoader />}><Search /></Suspense>}></Route>
        <Route path="/ruya/:slug" element={<Suspense fallback={<PageLoader />}><DreamDetail /></Suspense>}></Route>
        <Route path="/ruya-tabirleri" element={<Suspense fallback={<PageLoader />}><Popular /></Suspense>}></Route>
        <Route path="/kategoriler" element={<Suspense fallback={<PageLoader />}><Categories /></Suspense>}></Route>
        <Route path="/kategori/:slug" element={<Suspense fallback={<PageLoader />}><CategoryDetail /></Suspense>}></Route>
        <Route path="/populer" element={<Suspense fallback={<PageLoader />}><Popular /></Suspense>}></Route>
        <Route path="/az" element={<Suspense fallback={<PageLoader />}><AlphabetList /></Suspense>}></Route>
        <Route path="/az/:letter" element={<Suspense fallback={<PageLoader />}><AlphabetList /></Suspense>}></Route>
        <Route path="/profil" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>}></Route>
        <Route path="/ruya-gunlugum" element={<Suspense fallback={<PageLoader />}><DreamJournal /></Suspense>}></Route>
        <Route path="/favorilerim" element={<Suspense fallback={<PageLoader />}><Favorites /></Suspense>}></Route>
        <Route path="/gecmis" element={<Suspense fallback={<PageLoader />}><History /></Suspense>}></Route>
        <Route path="/admin/*" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>}></Route>
        <Route path="/hakkimizda" element={<Suspense fallback={<PageLoader />}><About /></Suspense>}></Route>
        <Route path="/iletisim" element={<Suspense fallback={<PageLoader />}><Contact /></Suspense>}></Route>
        <Route path="/gizlilik" element={<Suspense fallback={<PageLoader />}><Privacy /></Suspense>}></Route>
        <Route path="/kullanim-kosullari" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>}></Route>
        <Route path="/blog" element={<Suspense fallback={<PageLoader />}><Blog /></Suspense>}></Route>
        <Route path="/blog/etiket/:tag" element={<Suspense fallback={<PageLoader />}><BlogTag /></Suspense>}></Route>
        <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogPost /></Suspense>}></Route>
        <Route path="/yukle" element={<Suspense fallback={<PageLoader />}><Install /></Suspense>}></Route>
        <Route path="/abonelik-dogrula" element={<Suspense fallback={<PageLoader />}><SubscriptionVerify /></Suspense>}></Route>
        <Route path="/abonelik-iptal" element={<Suspense fallback={<PageLoader />}><SubscriptionCancel /></Suspense>}></Route>
        <Route path="/bildirimler" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>}></Route>
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>}></Route>
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <OfflineIndicator />
                <CommandPalette />
                <OnboardingTour />
                <InstallPrompt />
              </ErrorBoundary>
              <AnimatedRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.1,
  });
}

export default App;