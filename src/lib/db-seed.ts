import 'dotenv/config';
import { MongoClient } from 'mongodb';

console.log('Environment variables loaded:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

export async function seedDatabase() {
  let client: MongoClient | undefined;
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB directly
    client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('onlyinternship_dummy');
    
    // Create sample companies
    const companiesCollection = db.collection('Company');
    
    const company1 = await companiesCollection.insertOne({
      name: 'TechCorp Solutions',
      description: 'Leading software development company specializing in enterprise solutions and digital transformation.',
      logo: '🚀',
      website: 'https://techcorp.com',
      location: 'New York, NY',
      industry: 'Technology',
      size: '500-1000 employees',
      ownerId: '000000000000000000000001',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const company2 = await companiesCollection.insertOne({
      name: 'DataFlow Analytics',
      description: 'Innovative data analytics platform helping businesses make data-driven decisions.',
      logo: '📊',
      website: 'https://dataflow.com',
      location: 'San Francisco, CA',
      industry: 'Data Science',
      size: '100-500 employees',
      ownerId: '000000000000000000000002',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const company3 = await companiesCollection.insertOne({
      name: 'Growth Marketing Pro',
      description: 'Digital marketing agency focused on growth strategies and customer acquisition.',
      logo: '📈',
      website: 'https://growthmarketing.com',
      location: 'Chicago, IL',
      industry: 'Marketing',
      size: '50-100 employees',
      ownerId: '000000000000000000000003',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const company4 = await companiesCollection.insertOne({
      name: 'Design Studio X',
      description: 'Creative design studio specializing in user experience and brand identity.',
      logo: '🎨',
      website: 'https://designstudio.com',
      location: 'Austin, TX',
      industry: 'Design',
      size: '25-50 employees',
      ownerId: '000000000000000000000004',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const company5 = await companiesCollection.insertOne({
      name: 'Green Energy Co',
      description: 'Sustainable energy company developing renewable energy solutions for a greener future.',
      logo: '🌱',
      website: 'https://greenenergy.com',
      location: 'Denver, CO',
      industry: 'Renewable Energy',
      size: '200-500 employees',
      ownerId: '000000000000000000000005',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const companies = [company1, company2, company3, company4, company5];
    console.log(`✅ Created ${companies.length} companies`);
      
      // Create sample internships
    const internshipsCollection = db.collection('Internship');
    
    const internship1 = await internshipsCollection.insertOne({
      title: 'Frontend Developer Intern',
      description: 'Join our dynamic team to build modern web applications using React, TypeScript, and modern CSS frameworks.',
        companyId: company1.insertedId,
      location: 'New York, NY',
      locationType: 'onsite',
      duration: 12,
      stipend: 2500,
      skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Git'],
      responsibilities: ['Build responsive web interfaces', 'Collaborate with design team', 'Write clean, maintainable code'],
      qualifications: ['Currently pursuing Computer Science degree', 'Knowledge of React/JavaScript', 'Strong problem-solving skills'],
      startDate: new Date('2024-06-01'),
      applicationDeadline: new Date('2024-05-15'),
      status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const internship2 = await internshipsCollection.insertOne({
      title: 'Data Science Intern',
      description: 'Work on real-world data problems, develop machine learning models, and contribute to data-driven decision making.',
      companyId: company2.insertedId,
      location: 'San Francisco, CA',
        locationType: 'remote',
      duration: 24,
      stipend: 3000,
      skills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL'],
      responsibilities: ['Analyze large datasets', 'Develop ML models', 'Create data visualizations'],
      qualifications: ['Statistics/Mathematics background', 'Python programming skills', 'Experience with data analysis'],
      startDate: new Date('2024-06-01'),
      applicationDeadline: new Date('2024-05-20'),
      status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const internship3 = await internshipsCollection.insertOne({
      title: 'Marketing Intern',
      description: 'Learn digital marketing strategies, social media management, and campaign optimization in a fast-paced environment.',
      companyId: company3.insertedId,
      location: 'Chicago, IL',
        locationType: 'hybrid',
      duration: 16,
      stipend: 2000,
      skills: ['Social Media', 'Content Creation', 'Analytics', 'Copywriting', 'SEO'],
      responsibilities: ['Manage social media accounts', 'Create marketing content', 'Analyze campaign performance'],
      qualifications: ['Marketing or Business major', 'Social media savvy', 'Creative thinking'],
      startDate: new Date('2024-06-01'),
      applicationDeadline: new Date('2024-05-25'),
      status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const internship4 = await internshipsCollection.insertOne({
      title: 'UX/UI Design Intern',
      description: 'Create beautiful and functional user interfaces, conduct user research, and collaborate with development teams.',
      companyId: company4.insertedId,
      location: 'Austin, TX',
        locationType: 'onsite',
      duration: 12,
      stipend: 2800,
      skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping', 'User Research'],
      responsibilities: ['Design user interfaces', 'Conduct user research', 'Create design prototypes'],
      qualifications: ['Design portfolio', 'Figma/Sketch experience', 'User-centered design thinking'],
      startDate: new Date('2024-06-01'),
      applicationDeadline: new Date('2024-05-30'),
      status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const internship5 = await internshipsCollection.insertOne({
      title: 'Renewable Energy Research Intern',
      description: 'Contribute to cutting-edge research in solar energy, wind power, and energy storage technologies.',
      companyId: company5.insertedId,
      location: 'Denver, CO',
      locationType: 'onsite',
      duration: 20,
      stipend: 2200,
      skills: ['Engineering', 'Research Methods', 'Data Analysis', 'Technical Writing'],
      responsibilities: ['Conduct energy research', 'Analyze technical data', 'Write research reports'],
      qualifications: ['Engineering or Science major', 'Strong analytical skills', 'Interest in renewable energy'],
      startDate: new Date('2024-06-01'),
      applicationDeadline: new Date('2024-06-05'),
      status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
    const internships = [internship1, internship2, internship3, internship4, internship5];
    console.log(`✅ Created ${internships.length} internships`);

    console.log('🎉 Database seeding completed successfully!');
    return { companies, internships };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
    process.exit(1);
  });
}