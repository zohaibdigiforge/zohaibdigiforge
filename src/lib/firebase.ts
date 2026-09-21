import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, setLogLevel, disableNetwork } from 'firebase/firestore';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyDummyKeyForInitializationZohaibDigiForge",
  authDomain: firebaseAppletConfig.authDomain || "zohaib-digiforge.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "zohaib-digiforge",
  storageBucket: firebaseAppletConfig.storageBucket || "zohaib-digiforge.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "307454999263",
  appId: firebaseAppletConfig.appId || "1:307454999263:web:e104642f6447bc5f13476a"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const rawDatabaseId = (firebaseAppletConfig as any).firestoreDatabaseId;
export const isFirestoreProvisioned = Boolean(rawDatabaseId && typeof rawDatabaseId === 'string' && rawDatabaseId.trim().length > 0);
const databaseId = isFirestoreProvisioned ? rawDatabaseId : undefined;

// Set Firestore log level to error to avoid noisy connection probing warnings in console
try {
  setLogLevel('error');
} catch {}

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true
  }, databaseId);
} catch {
  try {
    firestoreInstance = databaseId 
      ? getFirestore(app, databaseId)
      : getFirestore(app);
  } catch (err) {
    firestoreInstance = getFirestore(app);
  }
}

// When a dedicated Firestore database is not yet provisioned in GCP, disable background network syncing
// so the SDK does not spam GrpcConnection stream RPC errors in console/logs
if (!isFirestoreProvisioned && firestoreInstance) {
  try {
    disableNetwork(firestoreInstance).catch(() => {});
  } catch {}
}

export const db = firestoreInstance;
export const auth = getAuth(app);

// Use session persistence so login state clears when browser/tab is closed
if (typeof window !== 'undefined') {
  setPersistence(auth, browserSessionPersistence).catch((err) => {
    console.warn('Firebase Auth persistence setup notice:', err);
  });
}

export default app;


