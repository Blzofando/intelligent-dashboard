"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { useAuthStore } from '@/store/authStore';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const user = useAuthStore((state) => state.user);
    const isLoadingAuth = useAuthStore((state) => state.isLoadingAuth);

    useEffect(() => {
        if (!isLoadingAuth && user) {
            router.push('/');
        }
    }, [user, isLoadingAuth, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('Nenhum usuário encontrado com esse email.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Por favor, informe um email válido.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Muitas requisições. Tente novamente mais tarde.');
            } else {
                setError('Ocorreu um erro ao enviar o email. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingAuth || user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
                <i className="fas fa-spinner fa-spin text-4xl text-primary-500"></i>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
                <h1 className="mb-2 text-center text-3xl font-bold text-primary-600 dark:text-primary-400">
                    <i className="fas fa-brain mr-2"></i>LearnAI
                </h1>
                <h2 className="mb-6 text-center text-xl text-gray-700 dark:text-gray-300">
                    Recuperar Senha
                </h2>

                {success ? (
                    <div className="space-y-4 text-center">
                        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/30">
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                Email de recuperação enviado com sucesso! Verifique sua caixa de entrada (e pasta de spam) para redefinir sua senha.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/login')}
                            className="mt-4 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Voltar para o Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
                            Digite seu email abaixo e enviaremos instruções para redefinir sua senha.
                        </p>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email cadastrado
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full justify-center flex items-center rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-75"
                        >
                            {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
                            {isLoading ? 'Enviando...' : 'Enviar Email de Recuperação'}
                        </button>

                        <div className="mt-4 text-center">
                            <a
                                href="/login"
                                className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                            >
                                Voltar para o Login
                            </a>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
