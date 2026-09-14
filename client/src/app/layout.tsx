import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CampusGrid — Smart Campus Operating System',
  description:
    'CampusGrid is an AI-powered Smart Campus OS — centralized academic resources, career opportunities, peer networking, real-time chat, and administrative tools for your college.',
  keywords: ['campus', 'college', 'students', 'placement', 'notes', 'AI', 'peer matching'],
  authors: [{ name: 'CampusGrid Team' }],
  openGraph: {
    title: 'CampusGrid — Smart Campus Operating System',
    description: 'AI-powered campus management platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(15, 22, 41, 0.95)',
                color: '#f1f5f9',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#0a0f1e' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0a0f1e' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
