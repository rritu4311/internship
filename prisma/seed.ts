import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';

async function main() {
  let client: MongoClient | null = null;
  try {
    console.log('Seeding (idempotent) database with initial data (Mongo driver)...');
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
    client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();

    const url = new URL(process.env.DATABASE_URL);
    const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
    const db = client.db(dbName);

    const users = db.collection('User');
    const profiles = db.collection('Profile');
    const companies = db.collection('Company');
    const internships = db.collection('Internship');
    const applications = db.collection('Application');
    const resources = db.collection('Resource');

    const [superAdminPassword, adminPassword, userPassword] = await Promise.all([
      bcrypt.hash('superadmin123', 10),
      bcrypt.hash('admin123', 10),
      bcrypt.hash('user123', 10),
    ]);

    // Ensure Super Admin
    let superAdmin = await users.findOne({ email: 'superadmin@onlyinternship.in' });
    if (!superAdmin) {
      const res = await users.insertOne({
        name: 'Super Admin',
        email: 'superadmin@onlyinternship.in',
        password: superAdminPassword,
        role: 'superadmin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      superAdmin = await users.findOne({ _id: res.insertedId });
    }

    // Ensure Admin
    let admin = await users.findOne({ email: 'admin@onlyinternship.in' });
    if (!admin) {
      const res = await users.insertOne({
        name: 'Admin User',
        email: 'admin@onlyinternship.in',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      admin = await users.findOne({ _id: res.insertedId });
    }

    // Ensure Regular User
    let user = await users.findOne({ email: 'user@onlyinternship.in' });
    if (!user) {
      const res = await users.insertOne({
        name: 'Regular User',
        email: 'user@onlyinternship.in',
        password: userPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      user = await users.findOne({ _id: res.insertedId });
    }

    // Ensure Profile for Regular User
    const existingProfile = await profiles.findOne({ userId: String(user!._id) });
    if (!existingProfile) {
      await profiles.insertOne({
        userId: String(user!._id),
        bio: 'Aspiring intern looking for opportunities.',
        skills: ['Communication', 'Teamwork', 'Problem Solving'],
        education: [{ degree: 'BBA', fieldOfStudy: 'Business Administration', endDate: '2025' }],
        experience: [],
        phoneNumber: '+91-9000000000',
        location: 'Delhi, India',
        linkedinProfile: 'https://linkedin.com/in/regularuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Ensure Company for Admin
    let company = await companies.findOne({ name: 'OnlyInternship Inc.' });
    if (!company) {
      const res = await companies.insertOne({
        name: 'OnlyInternship Inc.',
        description: 'The leading internship platform for MBA students',
        website: 'https://onlyinternship.in',
        location: 'Mumbai, India',
        industry: 'Education',
        size: '11-50',
        ownerId: String(admin!._id),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      company = await companies.findOne({ _id: res.insertedId });
    }

    // Ensure Internships
    let marketing = await internships.findOne({ title: 'Marketing Intern', companyId: String(company!._id) });
    if (!marketing) {
      const res = await internships.insertOne({
        title: 'Marketing Intern',
        description: 'Join our marketing team to help with digital campaigns and social media management.',
        companyId: String(company!._id),
        location: 'Mumbai, India',
        locationType: 'hybrid',
        duration: 12,
        stipend: 15000,
        skills: ['Digital Marketing', 'Social Media', 'Content Creation'],
        responsibilities: [
          'Assist in creating marketing campaigns',
          'Manage social media accounts',
          'Analyze marketing metrics',
        ],
        qualifications: [
          'Currently pursuing MBA with marketing specialization',
          'Strong communication skills',
          'Experience with social media platforms',
        ],
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      marketing = await internships.findOne({ _id: res.insertedId });
    }

    let finance = await internships.findOne({ title: 'Finance Intern', companyId: String(company!._id) });
    if (!finance) {
      const res = await internships.insertOne({
        title: 'Finance Intern',
        description: 'Work with our finance team on budgeting, forecasting, and financial analysis.',
        companyId: String(company!._id),
        location: 'Remote',
        locationType: 'remote',
        duration: 8,
        stipend: 12000,
        skills: ['Financial Analysis', 'Excel', 'Budgeting'],
        responsibilities: [
          'Assist in financial reporting',
          'Help with budget preparation',
          'Support financial analysis tasks',
          'Participate in forecasting activities',
        ],
        qualifications: [
          'Currently pursuing MBA with finance specialization',
          'Strong analytical skills',
          'Attention to detail',
          'Proficiency in Excel',
        ],
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      finance = await internships.findOne({ _id: res.insertedId });
    }

    // Ensure an application for the user
    const existingApp = await applications.findOne({ userId: String(user!._id), internshipId: String(marketing!._id) });
    if (!existingApp) {
      await applications.insertOne({
        userId: String(user!._id),
        internshipId: String(marketing!._id),
        status: 'pending',
        coverLetter: 'I am excited to apply for this internship!',
        resumeUrl: 'https://onlyinternship.in/resume/user.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Ensure a resource
    const existingResource = await resources.findOne({ title: 'Complete Resume Writing Guide' });
    if (!existingResource) {
      await resources.insertOne({
        title: 'Complete Resume Writing Guide',
        description: 'Learn how to create a compelling resume that stands out to employers and gets you interviews.',
        category: 'Resume & CV',
        type: 'guide',
        url: 'https://onlyinternship.in/resources/resume-guide',
        tags: ['resume', 'cv', 'writing', 'career'],
        isFree: true,
        rating: 4.8,
        views: 1250,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log('✅ Database seeded successfully (Mongo driver).');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

main();