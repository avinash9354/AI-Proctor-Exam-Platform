import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ExamGuard — Admin Console',
  description: 'Exam monitoring and administration dashboard',
  robots: 'noindex,nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#faf9f6] text-[#1e293b] antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '12px' },
              success: { iconTheme: { primary: '#f97316', secondary: '#ffffff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
