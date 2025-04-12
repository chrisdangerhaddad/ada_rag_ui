import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Load Inter font with subset of latin characters
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Dental AI Assistant',
  description: 'An AI chatbot powered by RAG technology to help answer questions about dental programs and policies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className={`font-sans antialiased`}>{children}</body>
    </html>
  );
}