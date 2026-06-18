import mongoose from 'mongoose';
import Folder from './models/Folder.js';

(async () => {
  await mongoose.connect('mongodb://localhost:27017/ai-learning-assistant');
  const result = await Folder.deleteMany({ path: { $ne: '/' } });
  console.log(`Deleted ${result.deletedCount} folders`);
  await mongoose.disconnect();
})();
