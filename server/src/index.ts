import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { testConnection } from './config/database';
import { env, isDevelopment } from './config/env';
import logger from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import dreamRoutes from './routes/dreams';
import categoryRoutes from './routes/categories';
import userRoutes from './routes/users';
import blogRoutes from './routes/blog';
import searchRoutes from './routes/search';
import contactRoutes from './routes/contact';
import adminRoutes from './routes/admin';
import communityRoutes from './routes/community';
import symbolRoutes from './routes/symbols';
import notificationRoutes from './routes/notifications';
import featureRoutes from './routes/features';
import { errorHandler } from './middleware/errorMiddleware';
import { etagMiddleware } from './middleware/etag';
import { premiumRateLimit } from './middleware/perUserRateLimit';

const app = express();
const PORT = env.PORT;

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(helmet());
app.use(etagMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 1000 for dev, 100 for production
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);
app.use('/api/', premiumRateLimit);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10 : 10, // 10 for dev, 10 for production
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { generateSitemap } = await import('./services/sitemapService');
    const xml = await generateSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('<?xml version="1.0"?><error>Failed to generate sitemap</error>');
  }
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: ${env.FRONTEND_URL || 'https://ruyatabirleri.com'}/sitemap.xml
`);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dreams', dreamRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/symbols', symbolRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/features', featureRoutes);

// Error handling middleware (must be before 404 handler)
app.use(errorHandler);

// 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Start server
async function startServer() {
  try {
    console.log('PORT value:', PORT);
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.fatal('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    const server = app.listen(PORT, '127.0.0.1', () => {
      logger.info({ port: PORT }, 'Server running');
      logger.info(`API available at http://localhost:${PORT}/api`);
      console.log(`Server listening on port ${PORT}`);
      console.log('Server address:', server.address());
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      logger.fatal({ err: error }, 'Server error');
      process.exit(1);
    });

    server.on('listening', () => {
      console.log('Server event: listening');
    });

    server.on('close', () => {
      console.log('Server event: close');
    });

    // Keep the process alive
    process.on('SIGINT', () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server shut down');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer().catch((error) => {
  logger.fatal({ err: error }, 'Unhandled error in startServer');
  process.exit(1);
});

export default app;