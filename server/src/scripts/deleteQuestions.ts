import '../config/env';
import mongoose from 'mongoose';
import Question from '../models/Question';

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gmat-practice';
  await mongoose.connect(mongoUri as string);

  const result = await Question.deleteMany({});
  console.log(`Deleted ${result.deletedCount} questions from database.`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
