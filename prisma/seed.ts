import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if we need to seed the database
    let userCount = 0;
    try {
      userCount = await prisma.user.count();
    } catch (error) {
      console.log('Error counting users, assuming empty database:', error);
    }
    
    if (userCount === 0) {
      console.log('Seeding database with initial data...');
    
    // Create a super admin user
    let superAdminUser;
    try {
      superAdminUser = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'superadmin@onlyinternship.in',
          password: 'superadmin123', // plain text for now
          role: 'superadmin',
        },
      });
      console.log('Created super admin user');
    } catch (error) {
      console.error('Error creating super admin user:', error);
      superAdminUser = await prisma.user.findUnique({
        where: { email: 'superadmin@onlyinternship.in' },
      });
      if (!superAdminUser) {
        throw new Error('Failed to create or find super admin user');
      }
    }
    
    // Create an admin user
    let adminUser;
    try {
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@onlyinternship.in',
          password: 'admin123', // plain text for now
          role: 'admin',
        },
      });
      console.log('Created admin user');
    } catch (error) {
      console.error('Error creating admin user:', error);
      adminUser = await prisma.user.findUnique({
        where: { email: 'admin@onlyinternship.in' },
      });
      if (!adminUser) {
        throw new Error('Failed to create or find admin user');
      }
    }
    
    // Create a company
    let company;
    try {
      company = await prisma.company.create({
        data: {
          name: 'OnlyInternship Inc.',
          description: 'The leading internship platform for MBA students',
          website: 'https://onlyinternship.in',
          location: 'Mumbai, India',
          industry: 'Education',
          size: '11-50',
          ownerId: adminUser.id, // Use direct ID assignment instead of connect
        },
      });
      console.log('Created company');
    } catch (error) {
      console.error('Error creating company:', error);
      // Try to find the company if it already exists
      company = await prisma.company.findFirst({
        where: { name: 'OnlyInternship Inc.' },
      });
      if (!company) {
        throw new Error('Failed to create or find company');
      }
    }
    
    // Create sample internships
    try {
      await prisma.internship.create({
        data: {
          title: 'Marketing Intern',
          description: 'Join our marketing team to help with digital campaigns and social media management.',
          companyId: company.id, // Use direct ID assignment instead of connect
          location: 'Mumbai, India',
          locationType: 'hybrid',
          duration: 12, // 12 weeks
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
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
    });
    console.log('Created Marketing Intern position');
    } catch (error) {
      console.error('Error creating Marketing Intern position:', error);
    }
    
    try {
      await prisma.internship.create({
        data: {
          title: 'Finance Intern',
          description: 'Work with our finance team on budgeting, forecasting, and financial analysis.',
          companyId: company.id, // Use direct ID assignment instead of connect
          location: 'Remote',
          locationType: 'remote',
          duration: 8, // 8 weeks
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
          startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        },
      });
      console.log('Created Finance Intern position');
    } catch (error) {
      console.error('Error creating Finance Intern position:', error);
    }
    
    // Create a regular user
    let regularUser;
    try {
      regularUser = await prisma.user.create({
        data: {
          name: 'Regular User',
          email: 'user@onlyinternship.in',
          password: 'user123', // plain text for now
          role: 'user',
        },
      });
      console.log('Created regular user');
    } catch (error) {
      console.error('Error creating regular user:', error);
      regularUser = await prisma.user.findUnique({
        where: { email: 'user@onlyinternship.in' },
      });
      if (!regularUser) {
        throw new Error('Failed to create or find regular user');
      }
    }

    // Create a profile for the regular user
    try {
      await prisma.profile.create({
        data: {
          userId: regularUser.id,
          bio: 'Aspiring intern looking for opportunities.',
          skills: ['Communication', 'Teamwork', 'Problem Solving'],
          education: [{ degree: 'BBA', fieldOfStudy: 'Business Administration', endDate: '2025' }],
          experience: [],
          phoneNumber: '+91-9000000000',
          location: 'Delhi, India',
          linkedinProfile: 'https://linkedin.com/in/regularuser',
        },
      });
      console.log('Created profile for regular user');
    } catch (error) {
      console.error('Error creating profile for regular user:', error);
    }

    // Create resources
    try {
      await prisma.resource.createMany({
        data: [
          {
            title: 'Complete Resume Writing Guide',
            description: 'Learn how to create a compelling resume that stands out to employers and gets you interviews.',
            category: 'Resume & CV',
            type: 'guide',
            url: 'https://onlyinternship.in/resources/resume-guide',
            tags: ['resume', 'cv', 'writing', 'career'],
            isFree: true,
            rating: 4.8,
            views: 1250,
          },
          {
            title: 'Interview Preparation Masterclass',
            description: 'Master common interview questions and learn techniques to ace your internship interviews.',
            category: 'Interview Prep',
            type: 'video',
            url: 'https://onlyinternship.in/resources/interview-prep',
            tags: ['interview', 'preparation', 'questions', 'techniques'],
            isFree: false,
            rating: 4.9,
            views: 890,
          },
          {
            title: 'Resume Templates Pack',
            description: 'Professional resume templates for different industries and experience levels.',
            category: 'Resume & CV',
            type: 'template',
            url: 'https://onlyinternship.in/resources/templates',
            tags: ['templates', 'resume', 'professional', 'download'],
            isFree: true,
            rating: 4.6,
            views: 2100,
          },
          {
            title: 'Networking for Students',
            description: 'Build meaningful professional relationships and expand your career network.',
            category: 'Networking',
            type: 'article',
            url: 'https://onlyinternship.in/resources/networking',
            tags: ['networking', 'relationships', 'professional', 'career'],
            isFree: true,
            rating: 4.5,
            views: 650,
          },
        ],
      });
      console.log('Created resources');
    } catch (error) {
      console.error('Error creating resources:', error);
    }

    // Create an application for the regular user to the first internship
    try {
      const internship = await prisma.internship.findFirst({ where: { companyId: company.id } });
      if (internship) {
        await prisma.application.create({
          data: {
            internshipId: internship.id,
            userId: regularUser.id,
            coverLetter: 'I am excited to apply for this internship!',
            resumeUrl: 'https://onlyinternship.in/resume/user.pdf',
            status: 'pending',
          },
        });
        console.log('Created application for regular user');
      }
    } catch (error) {
      console.error('Error creating application for regular user:', error);
    }
    
    console.log('Database seeded successfully');
  } else {
    console.log('Database already contains data, skipping seed');
  }
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });