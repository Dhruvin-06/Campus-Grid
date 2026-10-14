import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'CampusGrid — Smart Campus Platform',
  description:
    'CampusGrid is a smart campus platform — centralized academic resources, career opportunities, peer networking, real-time chat, and administrative tools for your college.',
  keywords: ['campus', 'college', 'students', 'notes', 'AI', 'peer matching'],
  authors: [{ name: 'CampusGrid Team' }],
  openGraph: {
    title: 'CampusGrid — Smart Campus Platform',
    description: 'Smart campus management platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e1e21',
                color: '#ececef',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#111113' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#111113' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
