# OnlyInternship.in - MBA Internship Portal

A modern, responsive internship portal built for MBA students and employers. Built with Next.js 15, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

### For Students
- **Browse Internships**: Search and filter through thousands of internship opportunities
- **Smart Matching**: AI-powered recommendations based on your profile and preferences
- **Quick Apply**: One-click application with saved profile information
- **Application Tracking**: Monitor your application status in real-time
- **Resume Builder**: Professional resume creation and management
- **Career Resources**: Access to career guidance and interview preparation

### For Employers
- **Post Internships**: Easy-to-use form to create and manage internship listings
- **Candidate Management**: Review applications, shortlist candidates, and manage the hiring process
- **Analytics Dashboard**: Track application metrics and performance
- **Company Profile**: Showcase your company culture and values
- **Bulk Operations**: Manage multiple internships and applications efficiently

### Technical Features
- **Mobile-First Design**: Fully responsive across all devices
- **Dark Mode**: Toggle between light and dark themes
- **Real-time Search**: Instant search results with filters
- **SEO Optimized**: Built-in SEO with meta tags and structured data
- **Performance**: Optimized for speed with Next.js 15 and Turbopack
- **Accessibility**: WCAG 2.1 compliant with proper ARIA attributes

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Heroicons
- **UI Components**: Headless UI
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: MongoDB with Prisma ORM
- **Deployment**: Vercel
- **Testing**: Vitest + React Testing Library

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/onlyinternship.in.git
cd onlyinternship.in
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with the following variables:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=mongodb://localhost:27017/onlyinternship
```

4. **Set up MongoDB**

**Option A: Local MongoDB**
- Install MongoDB Community Edition on your local machine from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- Start the MongoDB service
- The default connection string is already set in `.env.local`: `mongodb://localhost:27017/onlyinternship`

**Option B: MongoDB Atlas (Cloud)**
- Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create a new cluster
- Create a database user with read/write permissions
- Get your connection string and replace the `DATABASE_URL` in `.env.local` with: `mongodb+srv://username:password@cluster.mongodb.net/onlyinternship?retryWrites=true&w=majority`

**Initialize the Database**
```bash
npm run db:generate
npm run db:init
npm run db:seed
```

5. **Run the development server**
```bash
npm run dev
```

## 💾 MongoDB Integration

This project uses MongoDB with Prisma ORM for data storage. Here's what you need to know:

### Database Models

The following models are defined in `prisma/schema.prisma`:

- **User**: User accounts with authentication information
- **Profile**: Extended user profile information
- **Company**: Company information for employers
- **Internship**: Internship listings with details
- **Application**: Student applications for internships
- **Account**: OAuth accounts linked to users
- **Session**: User sessions for authentication
- **VerificationToken**: Email verification tokens

### Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:init` - Initialize database connection
- `npm run db:seed` - Seed the database with sample data
- `npm run db:studio` - Open Prisma Studio to view/edit data
- `npm run db:reset` - Reset the database and reseed

### API Integration

The API routes in `src/app/api/` are configured to use MongoDB through Prisma. If the database connection fails, the system will fall back to mock data to ensure the application continues to function.
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # App
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   
   # Database (choose one)
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/onlyinternship
   
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # File Storage
   # AWS S3
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   
   # Vercel
   VERCEL_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
onlyinternship.in/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── internships/   # Internship CRUD operations
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   └── upload/        # File upload endpoints
│   │   ├── internships/       # Internship pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # Reusable components
│   │   ├── Header.tsx         # Navigation header
│   │   ├── Footer.tsx         # Site footer
│   │   ├── InternshipCard.tsx # Internship listing card
│   │   ├── Filters.tsx        # Search filters
│   │   └── ui/                # UI components
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── db.ts              # Database connection
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── tailwind.config.ts         # Tailwind configuration
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard
   - Deploy

3. **Custom Domain Setup**
   - Add your domain in Vercel dashboard
   - Update DNS records as instructed
   - Configure SSL certificate

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Database Setup

#### MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Add to environment variables

#### Supabase
1. Create a Supabase project
2. Get your project URL and keys
3. Add to environment variables
4. Run database migrations

### Authentication Setup

1. **Install NextAuth.js**
   ```bash
   npm install next-auth
   ```

2. **Configure providers** in `src/lib/auth.ts`
   ```typescript
   import NextAuth from 'next-auth';
   import GoogleProvider from 'next-auth/providers/google';
   import CredentialsProvider from 'next-auth/providers/credentials';

   export const authOptions = {
     providers: [
       GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       }),
       // Add more providers as needed
     ],
     // Configure callbacks, pages, etc.
   };
   ```

### File Upload Setup

#### AWS S3
1. Create an S3 bucket
2. Configure CORS policy
3. Create IAM user with S3 permissions
4. Add credentials to environment variables

#### Supabase Storage
1. Enable Storage in Supabase dashboard
2. Create storage buckets
3. Configure policies
4. Add keys to environment variables

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Header.test.tsx
```

### Test Structure
```
src/
├── __tests__/
│   ├── components/
│   │   ├── Header.test.tsx
│   │   └── InternshipCard.test.tsx
│   ├── pages/
│   └── utils/
└── __mocks__/
```

## 📱 Mobile Optimization

The application is built with a mobile-first approach:

- **Responsive Design**: All components adapt to screen size
- **Touch-Friendly**: Optimized for touch interactions
- **Performance**: Optimized images and lazy loading
- **PWA Ready**: Can be installed as a Progressive Web App

## 🔍 SEO & Performance

### SEO Features
- Meta tags for all pages
- Structured data (JSON-LD)
- Sitemap generation
- Robots.txt
- Open Graph tags
- Twitter Cards

### Performance Optimizations
- Next.js Image optimization
- Code splitting
- Lazy loading
- Bundle analysis
- Core Web Vitals optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write tests for new components
- Follow the existing code structure
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.onlyinternship.in](https://docs.onlyinternship.in)
- **Issues**: [GitHub Issues](https://github.com/yourusername/onlyinternship.in/issues)
- **Email**: support@onlyinternship.in

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Basic internship listing
- ✅ Search and filters
- ✅ Responsive design
- ✅ API endpoints

### Phase 2 (Next)
- 🔄 User authentication
- 🔄 Application system
- 🔄 Dashboard for users
- 🔄 File upload system

### Phase 3 (Future)
- 📋 Advanced analytics
- 📋 AI-powered matching
- 📋 Video interviews
- 📋 Mobile app

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Tailwind CSS for the utility-first CSS framework
- Framer Motion for smooth animations
- Heroicons for beautiful icons

---

**Built with ❤️ for the Indian MBA community**
