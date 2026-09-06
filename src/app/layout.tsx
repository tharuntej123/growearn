import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Groearn — AI Career Ecosystem & Talent Platform',
  description:
    'An AI-powered professional ecosystem unifying e-learning, mentorship, professional freelance/local jobs, and talent hiring into one connected platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAF9] text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster richColors position="top-right" theme="light" />
        </AuthProvider>
      </body>
    </html>
  );
}
