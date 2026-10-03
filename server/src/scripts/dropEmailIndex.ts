import mongoose from 'mongoose';
import { env } from '../config/env';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    await mongoose.connection.collection('authorities').dropIndex('email_1');
    console.log('✅ Dropped unique email index from authorities');
  } catch (e: any) {
    if (e.code === 27) console.log('ℹ️  Index did not exist, nothing to drop');
    else console.error('Error:', e.message);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
