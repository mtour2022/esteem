// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqfHcY7gsyqNENa2VsYh4mXYZ6sqafIWg",
  authDomain: "esteem-64c71.firebaseapp.com",
  projectId: "esteem-64c71",
  storageBucket: "esteem-64c71.firebasestorage.app",
  messagingSenderId: "1066895705588",
  appId: "1:1066895705588:web:4e2d00e2a1e045fd93a5a1",
  measurementId: "G-9WDB0S448Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);