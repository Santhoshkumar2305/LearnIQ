const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'santhoshkumarstudy555@gmail.com';
    const adminName = process.env.ADMIN_NAME || 'Santhosh Admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'santhoshadmin123';

    const adminExists = await User.findOne({ email: adminEmail });
    
    if (!adminExists) {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isApproved: true,
        isEmailVerified: true
      });
      console.log(`Admin user seeded successfully: ${adminEmail}`);
    } else {
      let needsSave = false;
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        needsSave = true;
      }
      if (!adminExists.isEmailVerified) {
        adminExists.isEmailVerified = true;
        needsSave = true;
      }
      if (needsSave) {
        await adminExists.save();
        console.log(`Updated admin privileges for existing user: ${adminEmail}`);
      } else {
        console.log(`Admin user ready: ${adminEmail}`);
      }
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    const isAtlas = conn.connection.host.includes('mongodb.net');
    const dbType = isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB (Compass)';
    console.log(`✅ ${dbType} Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    await seedAdminUser();
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    if (error.message.includes('ETIMEDOUT') || error.message.includes('querySrv ENOTFOUND') || error.message.includes('IP')) {
      console.error('👉 TIP: Please verify that Network Access in MongoDB Atlas allows IP address 0.0.0.0/0 (Allow Access from Anywhere).');
    } else if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
      console.error('👉 TIP: Please check your Database User credentials (username/password) in server/.env.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
