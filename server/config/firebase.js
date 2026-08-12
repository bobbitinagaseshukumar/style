// Firebase Admin SDK Configuration
// Used for server-side verification of Firebase ID tokens
// Requires FIREBASE_SERVICE_ACCOUNT environment variable (JSON string)

let firebaseAdmin = null;

try {
  const admin = require('firebase-admin');

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseAdmin = admin;
    console.log('[FIREBASE ADMIN] Initialized successfully.');
  } else {
    console.warn('[FIREBASE ADMIN] FIREBASE_SERVICE_ACCOUNT env var not set. Server-side token verification disabled.');
  }
} catch (error) {
  console.warn('[FIREBASE ADMIN] Could not initialize:', error.message);
  console.warn('[FIREBASE ADMIN] Server-side token verification will be disabled. Google auth will use frontend-supplied data.');
}

module.exports = firebaseAdmin;
