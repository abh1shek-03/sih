const config = { apiKey: process.env.REACT_APP_FIREBASE_API_KEY, authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN, projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID };
export const getFirebaseMode = () => Object.values(config).every(Boolean) ? "connected" : "demo";
export const firebaseConfig = config;
export const getAuthStatus = () => ({ mode: getFirebaseMode(), roleAssignment: "admin-approved" });