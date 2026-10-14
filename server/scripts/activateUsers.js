require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const result = await User.updateMany({ isActive: false }, { $set: { isActive: true } });
  console.log(`Activated ${result.modifiedCount} users.`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
