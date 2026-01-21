// TypeScript
// ファイル: `apps/backend/src/config/firebaseAdmin.ts`
import admin from "firebase-admin";

let initialized = false;

export function getFirebaseAdmin() {
    if (!initialized) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error("Firebase Admin SDK の環境変数が不足しています");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        initialized = true;
    }

    return admin;
}
