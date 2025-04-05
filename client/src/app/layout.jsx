import { Inter } from 'next/font/google';
import './globals.css';
import { NextAuthProvider } from '../lib/provider';
import { AuthProvider } from '@/context/AuthProvider';
import { WebSocketProvider } from '@/context/WebSocketProvider';
import { UserPrefsProvider } from '@/context/UserPrefsProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pathway Real-time Q&A Assistant',
  description: 'A real-time Q&A assistant using Pathway and RAG techniques',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <AuthProvider>
            <WebSocketProvider>
              <UserPrefsProvider>
                {children}
              </UserPrefsProvider>
            </WebSocketProvider>
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}