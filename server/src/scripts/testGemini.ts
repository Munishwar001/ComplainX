import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const key = process.env.GEMINI_API_KEY || '';
console.log('Using key:', key.slice(0, 15) + '...');

async function test() {
  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent('Say "Gemini working" in JSON: {"status": "..."}');
  console.log('✅ Response:', result.response.text());
}

test().catch((e) => {
  console.error('❌ Failed:', e.message);
  console.log('\nThis key format is not valid for Gemini API.');
  console.log('Get a correct key from: https://aistudio.google.com/apikey');
  console.log('It should start with "AIzaSy..."');
});
