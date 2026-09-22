const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusgrid';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('--- Database Migration Started ---');

    // 1. Update any user with role 'placement_cell' to 'student'
    const updatedUsers = await User.updateMany(
      { role: 'placement_cell' },
      { $set: { role: 'student' } }
    );
    console.log(`Scrubbed placement_cell roles: ${updatedUsers.modifiedCount} users updated to 'student'.`);

    // 2. Unset bookmarkedJobs field across all user documents
    const cleanedBookmarks = await User.updateMany(
      { bookmarkedJobs: { $exists: true } },
      { $unset: { bookmarkedJobs: "" } }
    );
    console.log(`Removed bookmarkedJobs field: ${cleanedBookmarks.modifiedCount} user documents cleaned.`);

    // 3. Drop jobs collection if it exists
    const collections = await mongoose.connection.db.listCollections({ name: 'jobs' }).toArray();
    if (collections.length > 0) {
      await mongoose.connection.db.dropCollection('jobs');
      console.log('Dropped obsolete "jobs" collection.');
    } else {
      console.log('"jobs" collection does not exist or already dropped.');
    }

    console.log('--- Database Migration Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
