// src/config/firebaseAdmin.ts
/**
 * Firebase Admin SDK Configuration for Server-Side Operations
 * 
 * Este arquivo configura o Firebase Admin SDK que é usado em:
 * - API Routes (server-side)
 * - Cron Jobs
 * - Server Components
 * 
 * IMPORTANTE: Nunca use este arquivo no cliente (client-side)!
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

/**
 * Inicializa o Firebase Admin SDK
 * Usa credenciais de Service Account para acesso total ao Firestore
 */
function initializeFirebaseAdmin() {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        adminDb = getFirestore(adminApp);
        return { adminApp, adminDb };
    }

    try {
        // Método 1: Usando Service Account JSON (recomendado para produção)
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (serviceAccount) {
            // Parse da string JSON
            const serviceAccountConfig = JSON.parse(serviceAccount);

            adminApp = initializeApp({
                credential: cert(serviceAccountConfig),
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });

            console.log('✅ Firebase Admin inicializado com Service Account');
        }
        // Método 2: Usando credenciais individuais (fallback)
        else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            adminApp = initializeApp({
                credential: cert({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });

            console.log('✅ Firebase Admin inicializado com credenciais individuais');
        }
        // Método 3: Ambiente Google Cloud (Vercel com integração)
        else {
            adminApp = initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });

            console.log('✅ Firebase Admin inicializado com credenciais padrão do ambiente');
        }

        adminDb = getFirestore(adminApp);
        return { adminApp, adminDb };
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error);
        throw error;
    }
}

// Inicializa e exporta
const { adminApp: app, adminDb: db } = initializeFirebaseAdmin();

export { app as adminApp, db as adminDb };
