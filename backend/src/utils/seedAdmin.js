const Admin = require('../models/Admin');

const DEFAULT_ADMIN_EMAIL = 'admin@complaintportal.com';
const DEFAULT_ADMIN_PASSWORD = 'Complaint@123';

const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('[Seed] No portal account found. Initializing default admin account...');
      const admin = new Admin({
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD,
        role: 'admin',
      });
      await admin.save();
      console.log(`[Seed] Default portal account created successfully.`);
      console.log(`[Seed] Email: ${DEFAULT_ADMIN_EMAIL}`);
      console.log(`[Seed] Note: Password hashed securely with bcrypt.`);
    } else {
      const existingAdmin = await Admin.findOne().select('email');
      console.log(`[Seed] Portal account already exists for: ${existingAdmin ? existingAdmin.email : 'configured admin'}`);
    }
  } catch (error) {
    console.error('[Seed Error] Failed to initialize default admin:', error.message);
  }
};

module.exports = seedAdmin;
