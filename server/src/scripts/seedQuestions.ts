import '../config/env'; // load environment variables (supports APP_ENV_BLOB or .env)
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import Question from '../models/Question';

// Connect to database
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/gmat-practice';
        await mongoose.connect(mongoUri);
        console.log('[seedQuestions] Connected to MongoDB:', mongoUri.replace(/(:)([^:@\/]{4})[^:@]*(?=@)/, '$1$2****'));
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const seedQuestions = async () => {
    try {
        // Clear existing questions
        await Question.deleteMany({});
        console.log('Cleared existing questions');

        // Read the JSON file
        const jsonPath = path.join(__dirname, '../../../client/public/data/demo100-questions.json');
        const questionsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        console.log(`Found ${questionsData.questions.length} questions to import`);

        // Transform and insert questions
        const questionsToInsert = questionsData.questions.map((q: any) => ({
            questionText: q.question,
            options: q.options.map((opt: any) => opt.text), // Extract just the text from options
            correctAnswer: q.answer // This should be 'a', 'b', 'c', or 'd'
        }));

        const result = await Question.insertMany(questionsToInsert);
        console.log(`Successfully imported ${result.length} questions into the database`);

        // Verify the import
        const count = await Question.countDocuments();
        console.log(`Total questions in database: ${count}`);

        // Show first question as example
        const firstQuestion = await Question.findOne();
        console.log('Example question:', {
            questionText: firstQuestion?.questionText,
            options: firstQuestion?.options,
            correctAnswer: firstQuestion?.correctAnswer
        });

    } catch (error) {
        console.error('Error seeding questions:', error);
    }
};

const main = async () => {
    await connectDB();
    await seedQuestions();
    await mongoose.connection.close();
    console.log('Database connection closed');
};

main().catch(console.error);