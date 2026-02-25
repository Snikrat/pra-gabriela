// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPzzX1IEgjL3emfhTtvNakJBQW5BAIJHY",
  authDomain: "pra-gabriela.firebaseapp.com",
  projectId: "pra-gabriela",
  storageBucket: "pra-gabriela.firebasestorage.app",
  messagingSenderId: "730709975788",
  appId: "1:730709975788:web:14f292a89768573a9cbbc9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);