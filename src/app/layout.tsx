import React from 'react';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Inter } from 'next/font/google'; // 1. Importa a fonte

// 2. Configura a fonte
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter' // Define uma variável CSS
});

export const metadata = {
  title: 'Intelligent Learning Dashboard',
  description: 'Seu painel de aprendizado pessoal com IA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 3. Aplica a fonte ao HTML
    <html lang="en" className={inter.variable} suppressHydrationWarning> 
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
      </head>
      {/* 4. Aplica a fonte ao body */}
      <body className="font-sans bg-gray-100 dark:bg-gray-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}