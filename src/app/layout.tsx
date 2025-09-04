import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemeIndicator from '@/components/ThemeIndicator';
import { NextAuthProvider } from '@/lib/auth/provider';

// Database initialization is handled in the db-initializer module
// which is imported as a side effect in server components

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OnlyInternship.in - Find Your Perfect Internship",
  description: "Discover and apply to the best internships across India. Connect with top companies and kickstart your career with OnlyInternship.in",
  keywords: "internships, jobs, career, students, freshers, India, remote internships",
  authors: [{ name: "OnlyInternship.in" }],
  viewport: "width=device-width, initial-scale=1",
};

// Database initialization is now handled in a server component

// Import the server component for database initialization
import DbInitializer from './db-init';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
      >
        {/* Database initialization happens in this server component */}
        <DbInitializer />
        <NextAuthProvider>
          <ThemeProvider>
            {children}
            <ThemeIndicator />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
