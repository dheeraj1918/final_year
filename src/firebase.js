// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, orderBy, query, limit } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRjLtGr7n_0pdUBHcDwYsZIgEkZTZd_Sc",
  authDomain: "chat-appln-c94b0.firebaseapp.com",
  projectId: "chat-appln-c94b0",
  storageBucket: "chat-appln-c94b0.firebasestorage.app",
  messagingSenderId: "218796774916",
  appId: "1:218796774916:web:632867665492d732e58751",
  measurementId: "G-Z5VLRL083E"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Firestore exports
export { collection, orderBy, query, limit };

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);