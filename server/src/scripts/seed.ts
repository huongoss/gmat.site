import '../config/env';
import mongoose from 'mongoose';
import path from 'path';
import { promises as fs } from 'fs';
import Question from '../models/Question';

// Parse command line arguments
const args = process.argv.slice(2);
const cleanFlag = args.includes('--clean') || args.includes('-c');

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gmat-practice';
  await mongoose.connect(mongoUri as string);

  // Clean (delete all) existing questions if --clean flag is provided
  if (cleanFlag) {
    const existingCount = await Question.countDocuments();
    console.log(`🗑️  --clean flag detected. Deleting ${existingCount} existing questions...`);
    await Question.deleteMany({});
    console.log('✅ All existing questions deleted.');
  }

  // Read all JSON files from gmat-generator output folder
  const outputDir = path.resolve(process.cwd(), '../scripts/gmat-generator/output');
  const files = await fs.readdir(outputDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Found ${jsonFiles.length} JSON files in output folder`);

  const allQuestions: Array<{
    id: number;
    question: string;
    passage?: string; // optional passage for reading comprehension
    options: Array<{ id: string; text: string }>;
    answer: string;
    type?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string;
    verified?: boolean;
  }> = [];

  // Read and parse all JSON files
  for (const file of jsonFiles) {
    const filePath = path.join(outputDir, file);
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as {
      questions: Array<{
        id: number;
        question: string;
        passage?: string; // optional passage for reading comprehension
        options: Array<{ id: string; text: string }>;
        answer: string;
        type?: string;
        category?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        explanation?: string;
        verified?: boolean;
      }>;
    };
    allQuestions.push(...parsed.questions);
  }

  // Filter out unverified questions (verified: false)
  const verifiedQuestions = allQuestions.filter(q => q.verified !== false);
  console.log(`Total questions: ${allQuestions.length}, Verified: ${verifiedQuestions.length}`);

  // Map to schema: questionText, passage, options (string[]), correctAnswer (store the option id e.g. 'a')
  // Also include new metadata fields: type, category, difficulty, explanation, verified
  const docs = verifiedQuestions.map((q) => ({
    questionText: q.question,
    passage: q.passage, // include passage field
    options: q.options.map((o) => o.text),
    correctAnswer: q.answer,
    type: q.type,
    category: q.category,
    difficulty: q.difficulty,
    explanation: q.explanation,
    verified: q.verified,
  }));

  // Check for duplicates before inserting (skip if --clean was used)
  const existingCount = await Question.countDocuments();
  console.log(`Existing questions in database: ${existingCount}`);

  let newDocs = docs;
  
  if (!cleanFlag) {
    // Filter out questions that already exist (by questionText)
    const existingQuestions = await Question.find({}, { questionText: 1 });
    const existingTexts = new Set(existingQuestions.map(q => q.questionText));
    
    newDocs = docs.filter(doc => !existingTexts.has(doc.questionText));
  }
  
  if (newDocs.length > 0) {
    await Question.insertMany(newDocs);
    console.log(`Appended ${newDocs.length} new verified questions to database.`);
  } else {
    console.log('No new questions to add (all questions already exist).');
  }

  const finalCount = await Question.countDocuments();
  console.log(`Total questions in database: ${finalCount}`);
  
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
