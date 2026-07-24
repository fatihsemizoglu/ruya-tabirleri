import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    mode === "production" && SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
      authToken: SENTRY_AUTH_TOKEN,
      sourcemaps: { assets: "./dist/**/*.{js,css,map}" },
      release: { name: process.env.VITE_APP_VERSION || `ruya-tabirleri@${Date.now()}` },
      telemetry: false,
    }) : false,
    VitePWA({
      registerType: "prompt",
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/admin/, /^\/api/, /\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Navigation requests: network-first avoids serving stale HTML that references old chunks.
            // The SPA's OfflineIndicator shows a banner when navigator.onLine is false
            urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache-v2",
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
              sameOrigin && url.pathname === '/api/sitemap',
            handler: "NetworkFirst",
            options: {
              cacheName: "public-api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Supabase storage images: CacheFirst with 7-day expiration
            // Saves bandwidth on repeat visits; srcset URL params are honored
            urlPattern: /^https:\/\/dagjpitlouekbnwdcpbz\.supabase\.co\/storage\/v1\/object\//i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-images",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) =>
              sameOrigin && request.destination === 'image',
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "local-images",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // JS/CSS assets: StaleWhileRevalidate prevents old-chunk MIME errors
            // when a user has an old tab open referencing a removed chunk hash.
            urlPattern: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) =>
              sameOrigin && (request.destination === 'script' || request.destination === 'style'),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      includeAssets: ["favicon.ico", "robots.txt", "placeholder.svg", "offline.html"],
      manifest: {
        name: "Rüya Tabirleri - Mistik Günlük",
        short_name: "Rüya Tabirleri",
        description: "Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.",
        theme_color: "#6366f1",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["lifestyle", "education"],
        lang: "tr",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        screenshots: [
          {
            src: "/pwa-screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide"
          },
          {
            src: "/pwa-screenshot-narrow.png",
            sizes: "720x1280",
            type: "image/png",
            form_factor: "narrow"
          }
        ],
        shortcuts: [
          {
            name: "Rüya Ara",
            short_name: "Ara",
            description: "Rüya tabirlerinde ara",
            url: "/ara",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Rüya Günlüğüm",
            short_name: "Günlük",
            description: "Rüya günlüğüme yaz",
            url: "/ruya-gunlugum",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Popüler Rüyalar",
            short_name: "Popüler",
            description: "En popüler rüya tabirleri",
            url: "/populer",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      },
    })
  ] as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['debugger'] : [],
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: !!SENTRY_AUTH_TOKEN, // only emit maps when uploading to Sentry
    cssSourcemap: !!SENTRY_AUTH_TOKEN,
    commonjsOptions: {
      include: [/lucide-react/, /recharts/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('node_modules/scheduler/')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/react-router')) {
              return 'router-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('next-themes') || id.includes('sonner') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'app-ui-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            if (id.includes('dompurify')) {
              return 'sanitize-vendor';
            }
            if (id.includes('embla-carousel') || id.includes('react-day-picker')) {
              return 'interaction-vendor';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('cmdk')) {
              return 'ui-vendor';
            }
            if (id.includes('@tiptap')) {
              return 'editor-vendor';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion-vendor';
            }
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
  },
  legacy: {
    skipWebSocketTokenCheck: true,
  },
}));
