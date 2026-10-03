import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes      from './routes/auth.routes';
import complaintRoutes from './routes/complaint.routes';
import authorityRoutes from './routes/authority.routes';
import settingsRoutes  from './routes/settings.routes';
import devRoutes       from './routes/dev.routes';
import { startImapPoller, stopImapPoller } from './services/email/imapPoller';
import { getSettings } from './models/AppSettings';

const app = express();

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok', db: 'mongodb' }));

app.use('/api/auth',        authRoutes);
app.use('/api/complaints',  complaintRoutes);
app.use('/api/authorities', authorityRoutes);
app.use('/api/settings',    settingsRoutes);

if (env.isDev) {
  app.use('/api/dev', devRoutes);
  console.log('🔧 Dev routes enabled (/api/dev/simulate-email)');
}

app.use(errorHandler);

connectDB().then(async () => {
  app.listen(env.PORT, () => {
    console.log(`🚀 ComplanX server  →  http://localhost:${env.PORT}`);
    console.log(`🤖 AI Provider      →  ${env.OPENAI_API_KEY ? 'OpenAI GPT-4o-mini' : 'Mock (keyword-based)'}`);
    console.log(`📧 Email Provider   →  ${env.EMAIL_PROVIDER}`);
  });

  // Start poller only if Gmail is configured in DB
  const settings = await getSettings();
  if (settings.gmailEnabled && settings.gmailUser && settings.gmailAppPassword) {
    console.log(`📬 Gmail configured — starting poller for ${settings.gmailUser}`);
    startImapPoller();
  } else {
    console.log('📭 Gmail not configured — go to Settings to set up Gmail fetching');
  }
});

process.on('SIGTERM', () => { stopImapPoller(); process.exit(0); });
process.on('SIGINT',  () => { stopImapPoller(); process.exit(0); });

export default app;
