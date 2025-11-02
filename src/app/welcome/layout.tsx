import React from 'react';
import PrivateRoute from '@/components/PrivateRoute';

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Usamos o PrivateRoute aqui para garantir que apenas usuários logados
  // (mas ainda não completos) possam ver esta página.
  return (
    <PrivateRoute>
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        {children}
      </div>
    </PrivateRoute>
  );
}
