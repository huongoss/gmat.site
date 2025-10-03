import '../config/env';
import mongoose from 'mongoose';
import path from 'path';
import { promises as fs } from 'fs';
import Question from '../models/Question';

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gmat-practice';
  await mongoose.connect(mongoUri as string);

  const dataPath = path.resolve(process.cwd(), '../client/public/data/demo-questions.json');
  const raw = await fs.readFile(dataPath, 'utf-8');
  const parsed = JSON.parse(raw) as {
    questions: Array<{
      id: number;
      question: string;
      options: Array<{ id: string; text: string }>;
      answer: string; // option id (e.g., 'a')
    }>;
  };

  // Map to schema: questionText, options (string[]), correctAnswer (store the option id e.g. 'a')
  const docs = parsed.questions.map((q) => ({
    questionText: q.question,
    options: q.options.map((o) => o.text),
    correctAnswer: q.answer,
  }));

  await Question.deleteMany({});
  await Question.insertMany(docs);

  console.log(`Seeded ${docs.length} questions.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
