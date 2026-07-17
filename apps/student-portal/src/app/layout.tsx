import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ExamGuard — Student Portal',
  description: 'Secure online examination platform with AI-assisted proctoring',
  robots: 'noindex,nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-mesh min-h-screen antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#141d33',
                color: '#e8eaf6',
                border: '1px solid #1e2d50',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#141d33' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#141d33' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
