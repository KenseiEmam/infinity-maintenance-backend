import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Where your migrations are stored
  migrations: {
    path: 'prisma/migrations',
  },

  // Your database connection
  datasource: {
    url: env('DATABASE_URL'), // make sure DATABASE_URL is set in your .env
  },
});
