import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes';

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security & Header configuration
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'LTI Tech EduTech LMS API',
    timestamp: new Date().toISOString(),
  });
});

// Mount production API routes at /api/v1 and alias at /api
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// In standalone production environments (such as Docker, Cloud Run, or Node server), serve static SPA assets
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
