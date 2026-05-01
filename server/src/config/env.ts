import dotenv from 'dotenv';
import { cleanEnv, num, str } from 'envalid';

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  PORT: num({ default: 3001 }),
  FRONTEND_URL: str({ default: 'http://localhost:8080' }),
  JWT_SECRET: str({ devDefault: 'dev-secret-change-in-production' }),
  JWT_EXPIRES_IN: str({ default: '7d' }),
  SUPABASE_URL: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),
});

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';