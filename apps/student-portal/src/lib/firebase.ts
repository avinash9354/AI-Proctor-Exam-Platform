import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  Auth,
  UserCredential,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey !== 'your-api-key' &&
      firebaseConfig.projectId &&
      firebaseConfig.projectId !== 'your-project-id'
  );
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogleFirebase(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  return signInWithPopup(auth, googleProvider);
}
