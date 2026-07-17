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
      <body className="bg-[#0a0e1a] text-[#e8eaf6] antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#141d33', color: '#e8eaf6', border: '1px solid #1e2d50', borderRadius: '12px' },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
