import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Moon, ArrowLeft, Home, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { PremiumBackground, PremiumBadge, GradientText } from "@/components/layout/PremiumBackground";
import { captureError } from '@/lib/logger';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    captureError(new Error('404: ' + location.pathname), { tags: { feature: 'not-found' }, extra: { path: location.pathname } });
  }, [location.pathname]);

  return (
    <Layout>
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <PremiumBackground variant="strong" />

        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <PremiumBadge>
                <Moon className="h-3.5 w-3.5" />
                404 · Kayıp Sayfa
              </PremiumBadge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-[-0.04em] leading-none mb-6"
            >
              <span className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                404
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4"
            >
              Aradığınız sayfa{' '}
              <GradientText>burada değil</GradientText>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-10"
            >
              Belki de rüyalarınızın derinliklerine daldınız. Bir an için kaybolmuş olabilirsiniz — ama doğru yolu birlikte buluruz.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                size="lg"
                asChild
                className="relative h-12 px-7 rounded-xl text-sm sm:text-base font-semibold text-white border-0 shadow-lg shadow-fuchsia-500/25 group overflow-hidden"
              >
                <Link to="/">
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                  <Home className="relative h-4 w-4 mr-2" />
                  <span className="relative">Anasayfaya Dön</span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-7 rounded-xl text-sm sm:text-base font-semibold border-border hover:bg-muted group"
              >
                <Link to="/ara">
                  <Search className="h-4 w-4 mr-2" />
                  Rüya Ara
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            >
              <Link to="/populer" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                Popüler Rüyalar
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to="/kategoriler" className="hover:text-primary transition-colors">Kategoriler</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
