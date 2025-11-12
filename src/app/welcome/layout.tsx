import React from 'react';
import PrivateRoute from '@/components/PrivateRoute';

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivateRoute>
      {/* Layout atualizado: 
        - Fundo 'dark:bg-gray-900' para combinar com o app.
        - 'overflow-hidden' para evitar barras de rolagem durante a transição.
      */}
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        {children}
      </div>
    </PrivateRoute>
  );
}