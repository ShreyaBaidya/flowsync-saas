import { env } from './config/env';
import { connectDatabase } from './config/db';
import app from './app';

async function main(): Promise<void> {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`✓ Server running on port ${env.PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
