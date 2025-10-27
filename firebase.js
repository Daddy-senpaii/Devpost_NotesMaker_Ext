import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCr4M9P3l4tDs5menc6gFEj8Uqxnoqx394",
  authDomain: "notestaker-c0265.firebaseapp.com",
  projectId: "notestaker-c0265",
  storageBucket: "notestaker-c0265.firebasestorage.app",
  messagingSenderId: "569413967619",
  appId: "1:569413967619:web:877077431ea1c993501336",
  measurementId: "G-905PV5XC6Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;