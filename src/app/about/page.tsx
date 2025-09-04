'use client';

import { motion } from 'framer-motion';
import { 
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  HeartIcon,
  LightBulbIcon,
  GlobeAltIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  linkedin?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    role: 'Founder & CEO',
    bio: 'Former HR leader with 10+ years experience in talent acquisition and student development.',
    linkedin: 'https://linkedin.com/in/priya-sharma'
  },
  {
    id: '2',
    name: 'Rahul Verma',
    role: 'CTO',
    bio: 'Tech enthusiast with expertise in building scalable platforms and AI-driven solutions.',
    linkedin: 'https://linkedin.com/in/rahul-verma'
  },
  {
    id: '3',
    name: 'Anjali Patel',
    role: 'Head of Operations',
    bio: 'Operations expert focused on creating seamless experiences for students and employers.',
    linkedin: 'https://linkedin.com/in/anjali-patel'
  },
  {
    id: '4',
    name: 'Vikram Singh',
    role: 'Lead Product Manager',
    bio: 'Product strategist passionate about solving real-world problems through innovative solutions.',
    linkedin: 'https://linkedin.com/in/vikram-singh'
  }
];

const achievements: Achievement[] = [
  {
    id: '1',
    title: 'Students Placed',
    description: 'Successful internship placements across India',
    icon: <UserGroupIcon className="w-8 h-8" />,
    value: '50,000+'
  },
  {
    id: '2',
    title: 'Partner Companies',
    description: 'Trusted by leading organizations',
    icon: <BuildingOfficeIcon className="w-8 h-8" />,
    value: '500+'
  },
  {
    id: '3',
    title: 'Success Rate',
    description: 'Students who secured full-time offers',
    icon: <ChartBarIcon className="w-8 h-8" />,
    value: '85%'
  },
  {
    id: '4',
    title: 'Cities Covered',
    description: 'Pan-India presence and opportunities',
    icon: <GlobeAltIcon className="w-8 h-8" />,
    value: '25+'
  }
];

const values = [
  {
    icon: <HeartIcon className="w-6 h-6" />,
    title: 'Student-First Approach',
    description: 'Every decision we make is centered around empowering students and helping them succeed.'
  },
  {
    icon: <LightBulbIcon className="w-6 h-6" />,
    title: 'Innovation',
    description: 'We continuously innovate to provide cutting-edge solutions for the evolving job market.'
  },
  {
    icon: <CheckCircleIcon className="w-6 h-6" />,
    title: 'Quality',
    description: 'We maintain the highest standards in connecting students with quality opportunities.'
  },
  {
    icon: <GlobeAltIcon className="w-6 h-6" />,
    title: 'Inclusivity',
    description: 'We believe in creating equal opportunities for students from all backgrounds.'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            About OnlyInternship.in
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            We're on a mission to bridge the gap between talented students and amazing internship opportunities, 
            making career growth accessible to everyone.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                At OnlyInternship.in, we believe that every student deserves access to meaningful internship 
                opportunities that can shape their future careers. Our platform connects talented students 
                with forward-thinking companies, creating a win-win ecosystem for both parties.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                We're committed to democratizing access to quality internships, regardless of background, 
                location, or financial constraints. Through our innovative platform, we're building the 
                bridge between education and employment.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <StarIcon className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-600 dark:text-gray-300">Trusted by 50,000+ students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">500+ partner companies</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-300 mt-0.5" />
                    <span>Curated opportunities from verified companies</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-300 mt-0.5" />
                    <span>Personalized matching based on skills and interests</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-300 mt-0.5" />
                    <span>Comprehensive career resources and guidance</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-300 mt-0.5" />
                    <span>End-to-end support throughout the application process</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Impact
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Numbers that tell our story of success and growth
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-large transition-all duration-300"
              >
                <div className="text-primary-600 dark:text-primary-400 mb-4 flex justify-center">
                  {achievement.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {achievement.value}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {achievement.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {achievement.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4 p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="text-primary-600 dark:text-primary-400 mt-1">
                  {value.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The passionate people behind OnlyInternship.in
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-large transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-primary-600 dark:text-primary-400 font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {member.bio}
                </p>
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors"
                  >
                    Connect on LinkedIn
                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                OnlyInternship.in was born from a simple observation: talented students were struggling 
                to find quality internship opportunities, while companies were looking for bright minds 
                to join their teams.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Founded in 2023, we set out to create a platform that would bridge this gap. What started 
                as a small team of passionate individuals has grown into a comprehensive ecosystem serving 
                thousands of students and hundreds of companies across India.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Today, we're proud to be the go-to platform for internship opportunities, career guidance, 
                and professional development resources. Our journey continues as we work towards our vision 
                of making quality internships accessible to every student in India.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-6">Our Vision</h3>
              <p className="text-lg mb-6">
                To become India's leading platform for student career development, connecting millions 
                of students with meaningful opportunities that shape their professional journey.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <AcademicCapIcon className="w-5 h-5 text-yellow-300" />
                  <span>Empowering students with real-world experience</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-yellow-300" />
                  <span>Building strong industry-academia partnerships</span>
                </div>
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="w-5 h-5 text-yellow-300" />
                  <span>Creating a global network of opportunities</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-4"
          >
            Ready to Start Your Journey?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-primary-100 mb-8"
          >
            Join thousands of students who have found their dream internships through our platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="/internships"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium text-center"
            >
              Browse Internships
            </a>
            <a
              href="/resources"
              className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-primary-600 transition-colors font-medium text-center"
            >
              Explore Resources
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
