/**
 * Sets the Gemini API key directly in the .env file approach via process.
 * Since env vars are read at startup, just update server/.env
 * 
 * OR just manually edit server/.env and add:
 *   GEMINI_API_KEY=your_key_here
 * Then restart the server.
 * 
 * Run: npx tsx src/scripts/setGeminiKey.ts YOUR_GEMINI_KEY
 */
import fs from 'fs';
import path from 'path';

const key = process.argv[2];
if (!key) {
  console.error('Usage: npx tsx src/scripts/setGeminiKey.ts YOUR_GEMINI_KEY');
  process.exit(1);
}

const envPath = path.resolve(process.cwd(), '.env');
let content = fs.readFileSync(envPath, 'utf-8');

if (content.includes('GEMINI_API_KEY=')) {
  content = content.replace(/GEMINI_API_KEY=.*/,  `GEMINI_API_KEY="${key}"`);
} else {
  content += `\nGEMINI_API_KEY="${key}"\n`;
}

fs.writeFileSync(envPath, content);
console.log('✅ GEMINI_API_KEY saved to server/.env');
console.log('🔄 Restart the server for it to take effect: npm run dev');
