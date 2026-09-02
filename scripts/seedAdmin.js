const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventsphere';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);

    await mongoose.connect(mongoUri);

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@eventsphere.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Superadmin account (${adminEmail}) already exists.`);
      if (existingAdmin.role !== 'superadmin') {
        existingAdmin.role = 'superadmin';
        await existingAdmin.save();
        console.log(`Updated user role to superadmin.`);
      }
    } else {
      const superadmin = new User({
        name: 'System Superadmin',
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
        isActive: true
      });

      await superadmin.save();
      console.log(`Successfully created Superadmin account!`);
      console.log(`Email: ${adminEmail}`);
    }

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Admin Seed Script Failed: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
