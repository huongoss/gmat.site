import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dropUsernameIndex = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes before
    console.log('\n📋 Current indexes on users collection:');
    const indexesBefore = await collection.indexes();
    indexesBefore.forEach((idx: any) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop the username unique index
    try {
      await collection.dropIndex('username_1');
      console.log('\n✅ Successfully dropped username_1 index');
    } catch (e: any) {
      if (e.code === 27 || e.message.includes('index not found')) {
        console.log('\nℹ️  username_1 index does not exist (already dropped or never created)');
      } else {
        throw e;
      }
    }

    // List all indexes after
    console.log('\n📋 Indexes after drop:');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach((idx: any) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('Username field is now non-unique and can be used as a display name.\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

dropUsernameIndex();
